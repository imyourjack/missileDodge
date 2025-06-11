import { Difficulty, DifficultyConfig } from '../constants/gameConfig';

export interface MissileData {
  id: number;
  x: number;
  y: number;
  speed: number;
  size: number;
  trajectory: 'straight' | 'curved';
  angle?: number; // 곡선 궤적용
  targetX?: number; // 타겟팅용
}

export interface GameState {
  gameOver: boolean;
  gameStarted: boolean;
  score: number;
  level: number;
  difficulty: Difficulty;
  difficultyConfig: DifficultyConfig;
  planeX: number;
  planeY: number;
  missiles: MissileData[];
  soundEnabled: boolean;
  showDifficultySelect: boolean;
  gameTime: number; // 게임 시작 후 경과 시간 (초)
  lastLevelIncrease: number; // 마지막 레벨 증가 시간
}

export interface GameStats {
  totalMissilesDodged: number;
  maxLevel: number;
  playTime: number;
  averageScore: number;
}

export type GameScreen = 'menu' | 'difficultySelect' | 'game' | 'gameOver'; 