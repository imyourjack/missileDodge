export type Difficulty = 'normal' | 'hard';

export interface DifficultyConfig {
  name: string;
  missileSpeed: number;
  missileSpawnInterval: number;
  missileSize: number;
  missileCount: number; // 동시에 존재할 수 있는 최대 미사일 수
  scoreMultiplier: number;
  planeSpeed: number;
  missileSpawnPattern: 'random' | 'targeted' | 'mixed';
  missileTrajectory: 'straight' | 'curved' | 'mixed';
  difficultyIncreaseInterval: number; // 난이도 증가 간격 (초)
  maxDifficultyLevel: number; // 최대 난이도 레벨
  powerUpChance: number; // 파워업 아이템 등장 확률 (0-1)
  backgroundSpeed: number; // 배경 스크롤 속도
  soundPitch: number; // 사운드 피치 (1.0이 기본)
  visualEffects: {
    missileTrail: boolean;
    explosionParticles: boolean;
    screenShake: boolean;
  };
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  normal: {
    name: '쉬움',
    missileSpeed: 3,
    missileSpawnInterval: 200, // 0.5초에서 0.2초로 대폭 단축
    missileSize: 10,
    missileCount: 200, // 60에서 200으로 대대대대대대폭 증가
    scoreMultiplier: 1.0,
    planeSpeed: 1.0,
    missileSpawnPattern: 'random',
    missileTrajectory: 'straight',
    difficultyIncreaseInterval: 5, // 30초에서 5초로 대폭 단축
    maxDifficultyLevel: 10,
    powerUpChance: 0.1, // 10% 확률
    backgroundSpeed: 1,
    soundPitch: 1.0,
    visualEffects: {
      missileTrail: true,
      explosionParticles: true,
      screenShake: false,
    },
  },
  hard: {
    name: '어려움',
    missileSpeed: 6,
    missileSpawnInterval: 100, // 0.25초에서 0.1초로 대폭 단축
    missileSize: 8,
    missileCount: 400, // 100에서 400으로 대대대대대대폭 증가
    scoreMultiplier: 2.5,
    planeSpeed: 1.2,
    missileSpawnPattern: 'mixed',
    missileTrajectory: 'mixed',
    difficultyIncreaseInterval: 5, // 20초에서 5초로 대폭 단축
    maxDifficultyLevel: 20,
    powerUpChance: 0.05, // 5% 확률
    backgroundSpeed: 2,
    soundPitch: 1.2,
    visualEffects: {
      missileTrail: true,
      explosionParticles: true,
      screenShake: true,
    },
  },
};

// 난이도 레벨별 추가 설정
export const getDifficultyLevelConfig = (baseConfig: DifficultyConfig, level: number) => {
  const levelMultiplier = 1 + (level - 1) * 0.3; // 레벨당 30% 증가 (5%에서 30%로 대폭 증가)
  
  return {
    ...baseConfig,
    missileSpeed: baseConfig.missileSpeed * levelMultiplier,
    missileSpawnInterval: Math.max(30, baseConfig.missileSpawnInterval / levelMultiplier), // 최소 30ms로 더 단축
    missileCount: Math.min(1000, Math.floor(baseConfig.missileCount * levelMultiplier)), // 최대 1000개로 증가
    scoreMultiplier: baseConfig.scoreMultiplier * levelMultiplier,
  };
};

// 게임 전체 설정
export const GAME_CONFIG = {
  screenWidth: 0, // 런타임에 설정
  screenHeight: 0, // 런타임에 설정
  planeSize: 20,
  gameLoopInterval: 16, // 60fps
  maxScore: 999999,
  defaultDifficulty: 'normal' as Difficulty,
}; 