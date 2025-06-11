import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import Plane from './components/Plane';
import Missile from './components/Missile';
import DifficultySelect from './components/DifficultySelect';
import { checkCollision, checkCircleCollision, GameObject, CircleObject } from './utils/collision';
import {
  initSounds,
  playBackgroundMusic,
  stopBackgroundMusic,
  playCollisionSound,
  playGameOverSound,
  playScoreSound,
  playStartSound,
  playMoveSound,
  cleanupSounds,
  isSoundsLoaded,
} from './utils/soundEffects';
import { Difficulty, DIFFICULTY_CONFIGS, GAME_CONFIG } from './constants/gameConfig';
import { MissileData, GameState, GameScreen } from './types/game';
import {
  calculateMissilePosition,
  calculateMissileTrajectory,
  updateTargetingMissile,
  shouldIncreaseLevel,
  getCurrentLevelConfig,
  calculateScore,
  shouldSpawnMissile,
  calculateScreenShake,
  shouldSpawnPowerUp,
} from './utils/difficulty';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// GAME_CONFIG 업데이트
GAME_CONFIG.screenWidth = screenWidth;
GAME_CONFIG.screenHeight = screenHeight;

// 플랫폼별 최적화 설정
const isWeb = Platform.OS === 'web';
const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';

// 웹과 앱의 차이점을 고려한 설정
const WEB_OPTIMIZATIONS = {
  gameLoopInterval: 16, // 웹에서는 60fps
  touchSensitivity: 1.0, // 웹 터치 감도
  soundEnabled: true, // 웹에서는 사운드 기본 활성화
};

const MOBILE_OPTIMIZATIONS = {
  gameLoopInterval: 16, // 모바일에서도 60fps
  touchSensitivity: 1.2, // 모바일 터치 감도 증가
  soundEnabled: true, // 모바일에서도 사운드 기본 활성화
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    gameOver: false,
    gameStarted: false,
    score: 0,
    level: 1,
    difficulty: 'normal',
    difficultyConfig: DIFFICULTY_CONFIGS.normal,
    planeX: screenWidth / 2 - GAME_CONFIG.planeSize / 2,
    planeY: screenHeight - 150,
    missiles: [],
    soundEnabled: true,
    showDifficultySelect: false,
    gameTime: 0,
    lastLevelIncrease: 0,
  });
  
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('menu');
  const [screenShake] = useState(new Animated.Value(0));

  const gameLoopRef = useRef<any>(null);
  const missileIdRef = useRef(0);
  const missileIntervalRef = useRef<any>(null);
  const planePositionRef = useRef({ x: screenWidth / 2 - GAME_CONFIG.planeSize / 2, y: screenHeight - 150 });
  const animationFrameRef = useRef<number | null>(null);
  const lastScoreSoundRef = useRef(0);
  const lastSpawnTimeRef = useRef(Date.now());
  const gameStartTimeRef = useRef(0);

  // 사운드 시스템 초기화
  useEffect(() => {
    const initializeSound = async () => {
      try {
        await initSounds();
        console.log('사운드 시스템이 초기화되었습니다!');
      } catch (error) {
        console.log('사운드 시스템 초기화 실패:', error);
        setGameState(prev => ({ ...prev, soundEnabled: false }));
      }
    };

    initializeSound();
    return () => {
      cleanupSounds();
    };
  }, []);

  // 게임 초기화
  const initGame = useCallback(async (difficulty: Difficulty = 'normal') => {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const initialX = screenWidth / 2 - GAME_CONFIG.planeSize / 2;
    const initialY = screenHeight - 150;
    
    setGameState({
      gameOver: false,
      gameStarted: true,
      score: 0,
      level: 1,
      difficulty,
      difficultyConfig: config,
      planeX: initialX,
      planeY: initialY,
      missiles: [],
      soundEnabled: gameState.soundEnabled,
      showDifficultySelect: false,
      gameTime: 0,
      lastLevelIncrease: 0,
    });
    
    planePositionRef.current = { x: initialX, y: initialY };
    missileIdRef.current = 0;
    lastSpawnTimeRef.current = Date.now();
    gameStartTimeRef.current = Date.now();
    
    setCurrentScreen('game');
    
    // 게임 시작음 재생
    if (gameState.soundEnabled) {
      await playStartSound();
      setTimeout(() => {
        playBackgroundMusic();
      }, 1000);
    }
  }, [gameState.soundEnabled]);

  // 미사일 생성 함수 - 새로운 패턴 지원
  const createMissile = useCallback(() => {
    if (gameState.gameOver) return;
    
    const currentConfig = getCurrentLevelConfig(gameState.difficultyConfig, gameState.level);
    const { x, targetX } = calculateMissilePosition(
      currentConfig.missileSpawnPattern,
      planePositionRef.current.x,
      GAME_CONFIG.planeSize,
      currentConfig.missileSize
    );
    
    const newMissile: MissileData = {
      id: missileIdRef.current++,
      x,
      y: -currentConfig.missileSize,
      speed: currentConfig.missileSpeed,
      size: currentConfig.missileSize,
      trajectory: currentConfig.missileTrajectory === 'mixed' ? 
        (Math.random() < 0.2 ? 'curved' : 'straight') : 
        currentConfig.missileTrajectory,
      angle: Math.random() * Math.PI * 2, // 곡선 궤적용 초기 각도
      targetX,
    };
    
    setGameState(prev => ({
      ...prev,
      missiles: [...prev.missiles, newMissile],
    }));
  }, [gameState.gameOver, gameState.difficultyConfig, gameState.level]);

  // 게임 루프 - 성능 최적화 버전
  const gameLoop = useCallback(() => {
    if (gameState.gameOver) return;

    const currentTime = Date.now();
    const gameTime = Math.floor((currentTime - gameStartTimeRef.current) / 1000);
    const currentConfig = getCurrentLevelConfig(gameState.difficultyConfig, gameState.level);

    // 레벨 증가 체크
    if (shouldIncreaseLevel(gameTime, gameState.lastLevelIncrease, gameState.difficultyConfig)) {
      setGameState(prev => ({
        ...prev,
        level: Math.min(prev.level + 1, prev.difficultyConfig.maxDifficultyLevel),
        lastLevelIncrease: gameTime,
        gameTime,
      }));
    } else {
      setGameState(prev => ({ ...prev, gameTime }));
    }

    // 미사일 생성 체크 - 성능 최적화
    if (shouldSpawnMissile(
      gameState.missiles.length,
      currentConfig.missileCount,
      lastSpawnTimeRef.current,
      currentConfig.missileSpawnInterval
    )) {
      createMissile();
      lastSpawnTimeRef.current = currentTime;
    }

    // 미사일 이동 및 충돌 감지 - 성능 최적화
    setGameState(prev => {
      // 성능 최적화: 화면 밖 미사일 제거
      const updatedMissiles = prev.missiles
        .map(missile => {
          // 타겟팅 미사일 업데이트
          let updatedMissile = missile;
          if (missile.targetX) {
            updatedMissile = updateTargetingMissile(missile, planePositionRef.current.x, GAME_CONFIG.planeSize);
          }

          // 궤적 계산
          const { x, y } = calculateMissileTrajectory(updatedMissile, updatedMissile.trajectory);
          
          return {
            ...updatedMissile,
            x,
            y,
            angle: updatedMissile.angle ? updatedMissile.angle + 0.1 : 0,
          };
        })
        .filter(missile => missile.y < screenHeight + 100); // 여유 공간 증가

      // 충돌 감지 - 성능 최적화 (화면 안의 미사일만 체크)
      const visibleMissiles = updatedMissiles.filter(missile => 
        missile.y > planePositionRef.current.y - 200 && missile.y < planePositionRef.current.y + 200
      );

      const planeCircle: CircleObject = {
        x: planePositionRef.current.x + GAME_CONFIG.planeSize / 2,
        y: planePositionRef.current.y + GAME_CONFIG.planeSize / 2,
        radius: GAME_CONFIG.planeSize / 2,
      };

      for (const missile of visibleMissiles) {
        const missileCircle: CircleObject = {
          x: missile.x + missile.size / 2,
          y: missile.y + missile.size / 2,
          radius: missile.size / 2,
        };

        const dx = planeCircle.x - missileCircle.x;
        const dy = planeCircle.y - missileCircle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const collisionThreshold = planeCircle.radius + missileCircle.radius;

        if (distance < collisionThreshold) {
          // 충돌음 재생
          if (gameState.soundEnabled) {
            playCollisionSound();
            setTimeout(() => {
              playGameOverSound();
            }, 500);
            stopBackgroundMusic();
          }

          // 화면 흔들림 효과
          if (currentConfig.visualEffects.screenShake) {
            Animated.sequence([
              Animated.timing(screenShake, {
                toValue: 10,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(screenShake, {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
              }),
            ]).start();
          }

          setGameState(prev => ({ ...prev, gameOver: true }));
          setCurrentScreen('gameOver');
          return prev;
        }
      }

      return {
        ...prev,
        missiles: updatedMissiles,
      };
    });

    // 점수 증가 - 완전히 새로 작성된 로직
    setGameState(prev => {
      // 현재 프레임에서 얻는 점수 계산
      const baseScorePerFrame = 1;
      const difficultyMultiplier = prev.difficultyConfig.scoreMultiplier;
      const levelMultiplier = 1 + (prev.level - 1) * 0.08;
      
      // 현재 프레임의 점수 = 기본점수 * 난이도배율 * 레벨배율
      const currentFrameScore = Math.floor(baseScorePerFrame * difficultyMultiplier * levelMultiplier);
      
      // 새로운 총 점수 = 이전 점수 + 현재 프레임 점수
      const newTotalScore = prev.score + currentFrameScore;
      
      // 최대 점수 제한
      const finalScore = Math.min(newTotalScore, GAME_CONFIG.maxScore);
      
      // 사운드 재생 조건
      if (gameState.soundEnabled && finalScore > 0 && finalScore % 100 === 0 && finalScore > lastScoreSoundRef.current) {
        playScoreSound();
        lastScoreSoundRef.current = finalScore;
      }
      
      return {
        ...prev,
        score: finalScore,
      };
    });
  }, [gameState.gameOver, gameState.missiles.length, gameState.difficultyConfig, gameState.level, gameState.soundEnabled, createMissile, screenShake]);

  // 비행기 위치 업데이트 - 최적화
  const updatePlanePosition = useCallback(async (newX: number, newY: number) => {
    const minX = 0;
    const maxX = screenWidth - GAME_CONFIG.planeSize;
    const minY = 0;
    const maxY = screenHeight - GAME_CONFIG.planeSize;
    
    const clampedX = Math.max(minX, Math.min(maxX, newX));
    const clampedY = Math.max(minY, Math.min(maxY, newY));
    
    // ref 업데이트 (즉시)
    planePositionRef.current = { x: clampedX, y: clampedY };
    
    // 상태 업데이트는 지연
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      setGameState(prev => ({
        ...prev,
        planeX: clampedX,
        planeY: clampedY,
      }));
    });

    // 사운드는 간헐적으로만 재생
    if (gameState.soundEnabled && Math.random() < 0.1) { // 10% 확률로만 재생
      await playMoveSound();
    }
  }, [gameState.soundEnabled]);

  // 터치 이벤트 처리 - 최적화
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => true,
    onPanResponderMove: (evt, gestureState) => {
      if (gameState.gameOver || !gameState.gameStarted) return;
      
      const newX = planePositionRef.current.x + gestureState.dx;
      const newY = planePositionRef.current.y + gestureState.dy;
      
      updatePlanePosition(newX, newY);
    },
    onPanResponderRelease: () => {
      // 터치 종료 시 추가 처리 없음
    },
  });

  // 사운드 토글
  const toggleSound = useCallback(async () => {
    if (gameState.soundEnabled) {
      setGameState(prev => ({ ...prev, soundEnabled: false }));
      await stopBackgroundMusic();
    } else {
      setGameState(prev => ({ ...prev, soundEnabled: true }));
      if (gameState.gameStarted && !gameState.gameOver) {
        await playBackgroundMusic();
      }
    }
  }, [gameState.soundEnabled, gameState.gameStarted, gameState.gameOver]);

  // 게임 시작 시 타이머 설정 - 최적화
  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameOver) {
      // 플랫폼별 최적화된 게임 루프 간격
      const optimizedInterval = isWeb ? WEB_OPTIMIZATIONS.gameLoopInterval : MOBILE_OPTIMIZATIONS.gameLoopInterval;
      
      // 게임 루프 - 더 안정적인 타이머
      gameLoopRef.current = setInterval(() => {
        if (!gameState.gameOver) {
          gameLoop();
        }
      }, optimizedInterval);
      
      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
          gameLoopRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  }, [gameState.gameStarted, gameState.gameOver, gameLoop, isWeb]);

  // 게임 종료 함수
  const endGame = useCallback(() => {
    if (gameState.soundEnabled) {
      stopBackgroundMusic();
    }
    
    setGameState(prev => ({ ...prev, gameOver: true }));
    setCurrentScreen('gameOver');
  }, [gameState.soundEnabled]);

  // 게임 일시정지 함수
  const pauseGame = useCallback(() => {
    // 게임 일시정지 로직 (필요시 구현)
    console.log('게임 일시정지');
  }, []);

  // 화면별 렌더링
  const renderMenu = () => (
    <View style={styles.startOverlay}>
      <Text style={styles.titleText}>미사일 피하기</Text>
      <Text style={styles.instructionText}>
        동그라미를 사방으로 움직여서 미사일을 피하세요!
      </Text>
      <TouchableOpacity 
        style={styles.startButton} 
        onPress={() => setCurrentScreen('difficultySelect')}
      >
        <Text style={styles.startButtonText}>게임 시작</Text>
      </TouchableOpacity>
    </View>
  );

  const renderGame = () => (
    <Animated.View 
      style={[
        styles.gameArea,
        {
          transform: [
            { translateX: screenShake },
            { translateY: screenShake },
          ],
        },
      ]} 
      {...panResponder.panHandlers}
    >
      {/* 점수 및 레벨 표시 */}
      <View style={styles.gameInfo}>
        <Text style={styles.scoreText}>점수: {gameState.score}</Text>
        <Text style={styles.levelText}>레벨: {gameState.level}</Text>
        <Text style={styles.difficultyText}>{gameState.difficultyConfig.name}</Text>
      </View>
      
      {/* 게임 컨트롤 버튼들 */}
      <View style={styles.gameControls}>
        {/* 사운드 토글 버튼 */}
        <TouchableOpacity style={styles.controlButton} onPress={toggleSound}>
          <Text style={styles.controlButtonText}>
            {gameState.soundEnabled ? '🔊' : '🔇'}
          </Text>
        </TouchableOpacity>
        
        {/* 게임 끝내기 버튼 */}
        <TouchableOpacity style={[styles.controlButton, styles.endGameButton]} onPress={endGame}>
          <Text style={styles.endGameButtonText}>✕</Text>
        </TouchableOpacity>
      </View>
      
      {/* 비행기 */}
      <Plane
        x={gameState.planeX}
        y={gameState.planeY}
        width={GAME_CONFIG.planeSize}
        height={GAME_CONFIG.planeSize}
      />
      
      {/* 미사일들 */}
      {gameState.missiles.map((missile) => (
        <Missile
          key={missile.id}
          x={missile.x}
          y={missile.y}
          width={missile.size}
          height={missile.size}
        />
      ))}
    </Animated.View>
  );

  const renderGameOver = () => (
    <View style={styles.gameOverOverlay}>
      <View style={styles.gameOverContent}>
        <Text style={styles.gameOverText}>게임 오버!</Text>
        <Text style={styles.finalScoreText}>최종 점수: {gameState.score}점</Text>
        <Text style={styles.finalLevelText}>최종 레벨: {gameState.level}</Text>
        <Text style={styles.finalDifficultyText}>난이도: {gameState.difficultyConfig.name}</Text>
        <TouchableOpacity style={styles.restartButton} onPress={() => setCurrentScreen('difficultySelect')}>
          <Text style={styles.restartButtonText}>다시 시작</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuButton} onPress={() => setCurrentScreen('menu')}>
          <Text style={styles.menuButtonText}>메인 메뉴</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {currentScreen === 'menu' && renderMenu()}
      {currentScreen === 'difficultySelect' && (
        <DifficultySelect
          onDifficultySelect={initGame}
          onBack={() => setCurrentScreen('menu')}
        />
      )}
      {currentScreen === 'game' && renderGame()}
      {currentScreen === 'gameOver' && renderGameOver()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  gameInfo: {
    position: 'absolute',
    top: 120,
    left: 20,
    zIndex: 1000,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  levelText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  difficultyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
  },
  soundButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 50,
    height: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  soundButtonText: {
    fontSize: 24,
  },
  gameOverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  gameOverContent: {
    backgroundColor: '#FFF',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gameOverText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#F44336',
    marginBottom: 20,
  },
  finalScoreText: {
    fontSize: 24,
    color: '#333',
    marginBottom: 10,
    fontWeight: '600',
  },
  finalLevelText: {
    fontSize: 20,
    color: '#666',
    marginBottom: 10,
    fontWeight: '600',
  },
  finalDifficultyText: {
    fontSize: 18,
    color: '#888',
    marginBottom: 30,
    fontWeight: '600',
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  restartButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  menuButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  startOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
  },
  titleText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 15,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  gameControls: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1000,
  },
  controlButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  controlButtonText: {
    fontSize: 20,
  },
  endGameButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  endGameButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
  },
}); 