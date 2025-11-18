
export enum EntityType {
  PLAYER = 'PLAYER',
  GOOMBA = 'GOOMBA',
  KOOPA = 'KOOPA',
  MUSHROOM = 'MUSHROOM',
  FLOWER = 'FLOWER',
  FIREBALL = 'FIREBALL',
  PARTICLE = 'PARTICLE',
  FLAG = 'FLAG' // Visual entity for the cutscene
}

export enum TileType {
  AIR = 0,
  GROUND = 1,
  BRICK = 2,
  QUESTION_BLOCK = 3,
  QUESTION_BLOCK_HIT = 4,
  HARD_BLOCK = 5,
  PIPE_L = 6,
  PIPE_R = 7,
  PIPE_TOP_L = 8,
  PIPE_TOP_R = 9,
  POLE = 10,
  FLAG = 11, // Map tile, converted to entity on load
  COIN = 12,
  INVISIBLE_BLOCK = 13,
  CLOUD = 14,
  BUSH = 15,
  HILL = 16,
  CASTLE = 17
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Entity {
  id: number;
  type: EntityType;
  pos: Vector2D;
  vel: Vector2D;
  width: number;
  height: number;
  dead: boolean;
  grounded: boolean;
  direction: -1 | 1; // -1 left, 1 right
  state?: string; // e.g., 'walking', 'shell'
  frameTimer?: number;
}

export interface Player extends Entity {
  powerMode: 'small' | 'big' | 'fire';
  isJumping: boolean;
  invulnerable: number; // Frames of invulnerability
}

export interface GameStats {
  score: number;
  coins: number;
  world: string;
  time: number;
  lives: number;
}

export interface LevelData {
  map: number[][]; // Row-major: map[y][x]
  entities: Entity[];
  backgroundColor: string;
}

export enum GameStatus {
  MENU = 'MENU',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}