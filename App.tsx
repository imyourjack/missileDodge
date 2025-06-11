import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  Alert,
} from 'react-native';
import Plane from './components/Plane';
import Missile from './components/Missile';
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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MissileData {
  id: number;
  x: number;
  y: number;
}

export default function App() {
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [planeX, setPlaneX] = useState(screenWidth / 2 - 25);
  const [planeY, setPlaneY] = useState(screenHeight - 150);
  const [missiles, setMissiles] = useState<MissileData[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const planeWidth = 20;
  const planeHeight = 20;
  const missileWidth = 10;
  const missileHeight = 10;

  const gameLoopRef = useRef<any>(null);
  const missileIdRef = useRef(0);
  const missileIntervalRef = useRef<any>(null);
  const planePositionRef = useRef({ x: screenWidth / 2 - 25, y: screenHeight - 150 });
  const animationFrameRef = useRef<number | null>(null);
  const lastScoreSoundRef = useRef(0);

  // 사운드 시스템 초기화
  useEffect(() => {
    const initializeSound = async () => {
      try {
        await initSounds();
        console.log('사운드 시스템이 초기화되었습니다!');
      } catch (error) {
        console.log('사운드 시스템 초기화 실패:', error);
        setSoundEnabled(false);
      }
    };

    initializeSound();

    // 컴포넌트 언마운트 시 사운드 정리
    return () => {
      cleanupSounds();
    };
  }, []);

  // 게임 초기화
  const initGame = useCallback(async () => {
    setGameOver(false);
    setScore(0);
    const initialX = screenWidth / 2 - 25;
    const initialY = screenHeight - 150;
    setPlaneX(initialX);
    setPlaneY(initialY);
    planePositionRef.current = { x: initialX, y: initialY };
    setMissiles([]);
    missileIdRef.current = 0;
    setGameStarted(true);
    
    // 게임 시작음 재생
    if (soundEnabled) {
      await playStartSound();
      setTimeout(() => {
        playBackgroundMusic();
      }, 1000);
    }
  }, [soundEnabled]);

  // 미사일 생성 함수 - 수직으로만 떨어지도록 수정
  const createMissile = useCallback(async () => {
    if (gameOver) return;
    
    // 미사일 수 제한 제거 - 무제한 생성
    setMissiles(prev => {
      const newMissile: MissileData = {
        id: missileIdRef.current++,
        x: Math.random() * (screenWidth - missileWidth), // 랜덤 X 위치
        y: -missileHeight, // 화면 위에서 시작
      };
      
      return [...prev, newMissile];
    });
  }, [gameOver, missileWidth, missileHeight, screenWidth]);

  // 게임 루프 - 최적화된 버전
  const gameLoop = useCallback(() => {
    if (gameOver) return;

    // 미사일 이동 - 수직으로만 떨어지도록 수정
    setMissiles(prev => {
      if (prev.length === 0) {
        return prev;
      }
      
      // 화면 밖으로 나간 미사일만 필터링 (성능 최적화)
      const updated = prev.map(missile => ({
        ...missile,
        y: missile.y + 4, // 미사일 속도
      })).filter(missile => missile.y < screenHeight + 50); // 여유 공간 추가
      
      // 충돌 감지 최적화 - 화면 안의 미사일만 체크
      const visibleMissiles = updated.filter(missile => 
        missile.y > planePositionRef.current.y - 100 && missile.y < planePositionRef.current.y + 100
      );
      
      if (visibleMissiles.length > 0) {
        const planeCircle: CircleObject = {
          x: planePositionRef.current.x + planeWidth / 2,
          y: planePositionRef.current.y + planeHeight / 2,
          radius: 10,
        };

        // 충돌 감지 - 첫 번째 충돌만 감지
        for (let i = 0; i < visibleMissiles.length; i++) {
          const missile = visibleMissiles[i];
          const missileCircle: CircleObject = {
            x: missile.x + missileWidth / 2,
            y: missile.y + missileHeight / 2,
            radius: 3,
          };

          const dx = planeCircle.x - missileCircle.x;
          const dy = planeCircle.y - missileCircle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const collisionThreshold = planeCircle.radius + missileCircle.radius;

          if (distance < collisionThreshold) {
            // 충돌음 재생
            if (soundEnabled) {
              playCollisionSound();
              setTimeout(() => {
                playGameOverSound();
              }, 500);
              stopBackgroundMusic();
            }
            
            setGameOver(true);
            return updated;
          }
        }
      }
      
      return updated;
    });

    // 점수 증가 - 최적화 (100점마다 점수 획득음 재생)
    setScore(prev => {
      const newScore = prev + 1;
      if (soundEnabled && newScore % 100 === 0 && newScore > lastScoreSoundRef.current) {
        playScoreSound();
        lastScoreSoundRef.current = newScore;
      }
      return newScore;
    });
  }, [gameOver, planeWidth, planeHeight, missileWidth, missileHeight, score, initGame, screenHeight, soundEnabled]);

  // 비행기 위치 업데이트 함수 - 최적화
  const updatePlanePosition = useCallback(async (newX: number, newY: number) => {
    // 화면 경계 체크
    const minX = 0;
    const maxX = screenWidth - planeWidth;
    const minY = 0;
    const maxY = screenHeight - planeHeight;
    
    // 경계 내로 제한
    const clampedX = Math.max(minX, Math.min(maxX, newX));
    const clampedY = Math.max(minY, Math.min(maxY, newY));
    
    // ref 업데이트 (즉시)
    planePositionRef.current = { x: clampedX, y: clampedY };
    
    // 상태 업데이트는 requestAnimationFrame으로 지연
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      setPlaneX(clampedX);
      setPlaneY(clampedY);
    });

    // 비행기 이동음 재생
    if (soundEnabled) {
      await playMoveSound();
    }
  }, [planeWidth, planeHeight, screenWidth, screenHeight, soundEnabled]);

  // 터치 이벤트 처리 - 사방 이동 가능한 버전 (최적화)
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => true,
    onPanResponderMove: (evt, gestureState) => {
      if (gameOver || !gameStarted) return;
      
      // 사방 이동 - X축과 Y축 모두 업데이트
      const newX = planePositionRef.current.x + gestureState.dx;
      const newY = planePositionRef.current.y + gestureState.dy;
      
      // 최적화된 위치 업데이트
      updatePlanePosition(newX, newY);
    },
  });

  // 사운드 토글 함수
  const toggleSound = useCallback(async () => {
    if (soundEnabled) {
      setSoundEnabled(false);
      await stopBackgroundMusic();
    } else {
      setSoundEnabled(true);
      if (gameStarted && !gameOver) {
        await playBackgroundMusic();
      }
    }
  }, [soundEnabled, gameStarted, gameOver]);

  // 게임 시작 시 타이머 설정 - 최적화
  useEffect(() => {
    if (gameStarted && !gameOver) {
      // 즉시 첫 번째 미사일 생성
      setTimeout(() => {
        createMissile();
      }, 1000);
      
      // 게임 루프 - 60fps로 조정 (더 부드럽게)
      gameLoopRef.current = setInterval(() => {
        gameLoop();
      }, 16); // 60fps (1000ms / 60 = 16ms)
      
      // 미사일 생성
      missileIntervalRef.current = setInterval(() => {
        createMissile();
      }, 20000);
      
      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
        if (missileIntervalRef.current) {
          clearInterval(missileIntervalRef.current);
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    } else {
      // 게임이 끝나면 타이머 정리
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      if (missileIntervalRef.current) {
        clearInterval(missileIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [gameStarted, gameOver, gameLoop, createMissile, updatePlanePosition]);

  return (
    <View style={styles.container}>
      {/* 게임 영역 */}
      <View style={styles.gameArea} {...panResponder.panHandlers}>
        {/* 점수 표시 */}
        <Text style={styles.scoreText}>점수: {score}</Text>
        
        {/* 사운드 토글 버튼 */}
        <TouchableOpacity style={styles.soundButton} onPress={toggleSound}>
          <Text style={styles.soundButtonText}>
            {soundEnabled ? '🔊' : '🔇'}
          </Text>
        </TouchableOpacity>
        
        {/* 비행기 */}
        <Plane
          x={planeX}
          y={planeY}
          width={planeWidth}
          height={planeHeight}
        />
        
        {/* 미사일들 */}
        {missiles.map((missile, index) => (
          <Missile
            key={missile.id}
            x={missile.x}
            y={missile.y}
            width={missileWidth}
            height={missileHeight}
          />
        ))}
        
        {/* 게임 오버 화면 */}
        {gameOver && (
          <View style={styles.gameOverOverlay}>
            <View style={styles.gameOverContent}>
              <Text style={styles.gameOverText}>게임 오버!</Text>
              <Text style={styles.finalScoreText}>최종 점수: {score}점</Text>
              <TouchableOpacity style={styles.restartButton} onPress={initGame}>
                <Text style={styles.restartButtonText}>다시 시작</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* 시작 화면 */}
        {!gameStarted && !gameOver && (
          <View style={styles.startOverlay}>
            <Text style={styles.titleText}>미사일 피하기</Text>
            <Text style={styles.instructionText}>
              동그라미를 사방으로 움직여서 미사일을 피하세요!
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={initGame}>
              <Text style={styles.startButtonText}>게임 시작</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB', // 하늘색 배경
  },
  gameArea: {
    flex: 1,
    position: 'relative',
  },
  scoreText: {
    position: 'absolute',
    top: 50,
    left: 20,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    zIndex: 1000,
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
    marginBottom: 30,
    fontWeight: '600',
  },
  restartButton: {
    backgroundColor: '#4CAF50',
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
  restartButtonText: {
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
}); 