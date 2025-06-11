import { Difficulty, DifficultyConfig, getDifficultyLevelConfig } from '../constants/gameConfig';
import { MissileData } from '../types/game';

const { width: screenWidth, height: screenHeight } = require('react-native').Dimensions.get('window');

// 미사일 생성 패턴에 따른 위치 계산 - 성능 최적화 버전
export const calculateMissilePosition = (
  pattern: 'random' | 'targeted' | 'mixed',
  planeX: number,
  planeWidth: number,
  missileSize: number
): { x: number; targetX?: number } => {
  const margin = 15; // 화면 경계 여백 증가
  const maxX = Math.max(0, screenWidth - missileSize - 2 * margin);
  
  switch (pattern) {
    case 'random':
      return {
        x: margin + Math.random() * maxX,
      };
    
    case 'targeted':
      const targetX = Math.max(margin, Math.min(screenWidth - missileSize - margin, planeX + planeWidth / 2 - missileSize / 2));
      return {
        x: margin + Math.random() * maxX,
        targetX: targetX,
      };
    
    case 'mixed':
      const isTargeted = Math.random() < 0.25; // 25% 확률로 타겟팅 (30%에서 25%로 조정)
      if (isTargeted) {
        const targetX = Math.max(margin, Math.min(screenWidth - missileSize - margin, planeX + planeWidth / 2 - missileSize / 2));
        return {
          x: margin + Math.random() * maxX,
          targetX: targetX,
        };
      } else {
        return {
          x: margin + Math.random() * maxX,
        };
      }
    
    default:
      return {
        x: margin + Math.random() * maxX,
      };
  }
};

// 미사일 궤적 계산
export const calculateMissileTrajectory = (
  missile: MissileData,
  trajectory: 'straight' | 'curved' | 'mixed'
): { x: number; y: number } => {
  switch (trajectory) {
    case 'straight':
      return {
        x: missile.x,
        y: missile.y + missile.speed,
      };
    
    case 'curved':
      const angle = missile.angle || 0;
      const newAngle = angle + 0.1; // 곡선 움직임
      const radius = 50;
      return {
        x: missile.x + Math.sin(newAngle) * radius * 0.1,
        y: missile.y + missile.speed,
      };
    
    case 'mixed':
      const isCurved = Math.random() < 0.2; // 20% 확률로 곡선
      if (isCurved) {
        const angle = missile.angle || 0;
        const newAngle = angle + 0.1;
        const radius = 50;
        return {
          x: missile.x + Math.sin(newAngle) * radius * 0.1,
          y: missile.y + missile.speed,
        };
      } else {
        return {
          x: missile.x,
          y: missile.y + missile.speed,
        };
      }
    
    default:
      return {
        x: missile.x,
        y: missile.y + missile.speed,
      };
  }
};

// 타겟팅 미사일의 위치 업데이트
export const updateTargetingMissile = (missile: MissileData, planeX: number, planeWidth: number): MissileData => {
  if (!missile.targetX) return missile;
  
  const targetX = missile.targetX;
  const currentX = missile.x;
  const moveSpeed = 1; // 타겟팅 속도
  
  let newX = currentX;
  if (currentX < targetX) {
    newX = Math.min(currentX + moveSpeed, targetX);
  } else if (currentX > targetX) {
    newX = Math.max(currentX - moveSpeed, targetX);
  }
  
  return {
    ...missile,
    x: newX,
  };
};

// 난이도 레벨 증가 체크
export const shouldIncreaseLevel = (
  gameTime: number,
  lastLevelIncrease: number,
  difficultyConfig: DifficultyConfig
): boolean => {
  return gameTime - lastLevelIncrease >= difficultyConfig.difficultyIncreaseInterval;
};

// 현재 레벨에 따른 설정 가져오기
export const getCurrentLevelConfig = (baseConfig: DifficultyConfig, level: number): DifficultyConfig => {
  return getDifficultyLevelConfig(baseConfig, level);
};

// 점수 계산 (난이도와 레벨 고려)
export const calculateScore = (
  baseScore: number,
  difficultyConfig: DifficultyConfig,
  level: number
): number => {
  const levelConfig = getCurrentLevelConfig(difficultyConfig, level);
  return Math.floor(baseScore * levelConfig.scoreMultiplier);
};

// 미사일 생성 여부 결정 - 대량 처리 최적화 버전
export const shouldSpawnMissile = (
  currentMissileCount: number,
  maxMissileCount: number,
  lastSpawnTime: number,
  spawnInterval: number
): boolean => {
  const now = Date.now();
  
  // 성능 최적화: 너무 많은 미사일이 있을 때 생성 제한
  if (currentMissileCount >= maxMissileCount * 0.8) { // 90%에서 80%로 조정
    return false;
  }
  
  // 더 정확한 시간 체크
  return currentMissileCount < maxMissileCount && (now - lastSpawnTime) >= spawnInterval;
};

// 화면 흔들림 효과 계산
export const calculateScreenShake = (
  enabled: boolean,
  intensity: number = 5
): { x: number; y: number } => {
  if (!enabled) return { x: 0, y: 0 };
  
  return {
    x: (Math.random() - 0.5) * intensity,
    y: (Math.random() - 0.5) * intensity,
  };
};

// 파워업 아이템 생성 확률 체크
export const shouldSpawnPowerUp = (difficultyConfig: DifficultyConfig): boolean => {
  return Math.random() < difficultyConfig.powerUpChance;
}; 