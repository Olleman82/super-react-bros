import { TileType, LevelData, EntityType, Entity } from "../types";
import { COLORS, MAX_JUMP_HEIGHT_TILES, MAX_HORIZONTAL_GAP_TILES, MAX_STEP_HEIGHT_TILES } from "../constants";

const LEVEL_WIDTH = 220;
const LEVEL_HEIGHT = 15;

// Helper functions
const createEmptyMap = () => {
  const map: number[][] = [];
  for (let y = 0; y < LEVEL_HEIGHT; y++) {
    map.push(Array(LEVEL_WIDTH).fill(TileType.AIR));
  }
  return map;
};

const set = (map: number[][], x: number, y: number, t: TileType) => {
  if (x >= 0 && x < LEVEL_WIDTH && y >= 0 && y < LEVEL_HEIGHT) map[y][x] = t;
};

const fillRect = (map: number[][], x: number, y: number, w: number, h: number, t: TileType) => {
  for(let iy=0; iy<h; iy++) for(let ix=0; ix<w; ix++) set(map, x+ix, y+iy, t);
};

const placePipe = (map: number[][], x: number, h: number, groundLevel: number = 13) => {
  fillRect(map, x, groundLevel-h, 2, h, TileType.PIPE_L); 
  set(map, x, groundLevel-h, TileType.PIPE_TOP_L);
  set(map, x+1, groundLevel-h, TileType.PIPE_TOP_R);
  for(let i=1; i<=h; i++) {
    set(map, x, groundLevel-h+i, TileType.PIPE_L);
    set(map, x+1, groundLevel-h+i, TileType.PIPE_R);
  }
};

const placeGround = (map: number[][], start: number, width: number, y: number = 13) => {
  fillRect(map, start, y, width, 2, TileType.GROUND);
};

const createStair = (map: number[][], x: number, h: number, dir: 1 | -1, bottomY: number = 12) => {
  for(let i=0; i<h; i++) {
     for(let j=0; j<=i; j++) {
        set(map, x + (dir === 1 ? i : -i), bottomY-j, TileType.HARD_BLOCK);
     }
  }
};

const MAX_PLATFORM_OFFSET = Math.max(1, Math.floor(MAX_JUMP_HEIGHT_TILES));
const MAX_GAP_WIDTH = Math.max(1, Math.floor(MAX_HORIZONTAL_GAP_TILES));

const clampPlatformOffset = (offset: number) => Math.max(1, Math.min(offset, MAX_PLATFORM_OFFSET));

const placeFloatingPlatform = (
  map: number[][],
  x: number,
  width: number,
  heightAboveGround: number,
  tile: TileType = TileType.BRICK
) => {
  const offset = clampPlatformOffset(heightAboveGround);
  const row = Math.max(0, 13 - offset);
  fillRect(map, x, row, width, 1, tile);
  return row;
};

const placeMushroomPlatform = (map: number[][], x: number, width: number, heightAboveGround: number) => {
  const row = placeFloatingPlatform(map, x, width, heightAboveGround);
  const trunkTop = row + 1;
  const trunkHeight = Math.max(1, 13 - row);
  fillRect(
    map,
    x + Math.max(0, Math.floor(width / 2) - 1),
    trunkTop,
    Math.min(2, width),
    Math.min(trunkHeight, LEVEL_HEIGHT - trunkTop),
    TileType.HARD_BLOCK
  );
};

const carveGap = (map: number[][], start: number, width: number) => {
  const safeWidth = Math.min(width, MAX_GAP_WIDTH);
  for (let x = start; x < start + safeWidth; x++) {
    if (x < 0 || x >= LEVEL_WIDTH) continue;
    map[13][x] = TileType.AIR;
    map[14][x] = TileType.AIR;
  }
};

// Level 1-1 (Classic)
export const generateLevel1_1 = (): LevelData => {
  const map = createEmptyMap();
  const entities: Entity[] = [];
  
  // --- 1-1 Approximation ---
  placeGround(map, 0, 69);
  placeGround(map, 71, 15); 
  placeGround(map, 89, 64); 
  placeGround(map, 155, 65); 
  
  // Scenery
  [8, 19, 56, 67, 103, 114, 152, 163].forEach(x => set(map, x, 3, TileType.CLOUD));
  [27, 36, 75, 84, 123, 132, 171, 180].forEach(x => set(map, x, 4, TileType.CLOUD));
  [0, 48, 96, 144, 192].forEach(x => set(map, x, 10, TileType.HILL)); 
  [16, 64, 112, 160].forEach(x => set(map, x, 11, TileType.HILL)); 
  [11, 59, 107, 155].forEach(x => set(map, x, 12, TileType.BUSH)); 
  [23, 71, 119, 167].forEach(x => set(map, x, 12, TileType.BUSH)); 
  
  // Structures
  set(map, 16, 9, TileType.QUESTION_BLOCK);
  set(map, 20, 9, TileType.BRICK);
  set(map, 21, 9, TileType.QUESTION_BLOCK); // MUSHROOM BLOCK
  set(map, 22, 9, TileType.BRICK);
  set(map, 23, 9, TileType.QUESTION_BLOCK);
  set(map, 24, 9, TileType.BRICK);
  set(map, 22, 5, TileType.QUESTION_BLOCK); 
  
  placePipe(map, 28, 2);
  placePipe(map, 38, 3);
  placePipe(map, 46, 4);
  placePipe(map, 57, 4);
  
  set(map, 64, 8, TileType.INVISIBLE_BLOCK); 
  
  set(map, 77, 9, TileType.BRICK);
  set(map, 78, 9, TileType.QUESTION_BLOCK); // MUSHROOM/FLOWER BLOCK
  set(map, 79, 9, TileType.BRICK);
  
  fillRect(map, 80, 5, 8, 1, TileType.BRICK); 
  fillRect(map, 91, 5, 3, 1, TileType.BRICK);
  set(map, 94, 5, TileType.QUESTION_BLOCK); 
  set(map, 94, 9, TileType.BRICK);
  
  set(map, 100, 9, TileType.BRICK);
  set(map, 101, 9, TileType.BRICK);
  set(map, 105, 9, TileType.QUESTION_BLOCK);
  set(map, 106, 9, TileType.QUESTION_BLOCK);
  set(map, 109, 9, TileType.QUESTION_BLOCK);
  set(map, 109, 5, TileType.QUESTION_BLOCK); // MUSHROOM
  
  set(map, 118, 9, TileType.BRICK);
  set(map, 119, 5, TileType.BRICK);
  set(map, 120, 5, TileType.BRICK);
  set(map, 121, 5, TileType.BRICK);
  
  set(map, 129, 5, TileType.BRICK);
  set(map, 130, 5, TileType.BRICK);
  set(map, 129, 9, TileType.PIPE_L);
  set(map, 130, 9, TileType.BRICK); 
  
  createStair(map, 134, 4, 1);
  createStair(map, 143, 4, -1); 
  createStair(map, 148, 4, 1);
  createStair(map, 155, 4, -1); 
  
  createStair(map, 181, 8, 1); 
  
  // Flag
  set(map, 198, 12, TileType.HARD_BLOCK);
  fillRect(map, 198, 2, 1, 10, TileType.POLE);
  set(map, 198, 2, TileType.FLAG);
  set(map, 202, 12, TileType.CASTLE); 
  
  // Goombas
  const goombaX = [22, 40, 51, 52.5, 80, 82, 97, 98.5, 114, 115.5, 124, 125.5, 174, 175.5];
  goombaX.forEach((x, i) => {
    entities.push({
      id: i + 100,
      type: EntityType.GOOMBA,
      pos: { x: x * 16, y: 10 * 16 },
      vel: { x: -0.5, y: 0 },
      width: 16,
      height: 16,
      dead: false,
      grounded: false,
      direction: -1
    });
  });

  return {
    map,
    entities,
    backgroundColor: COLORS.SKY
  };
};

// Level 1-2 (Underground)
export const generateLevel1_2 = (): LevelData => {
  const map = createEmptyMap();
  const entities: Entity[] = [];
  
  // Ceiling and floor for underground feel
  placeGround(map, 0, 220, 13);
  fillRect(map, 0, 0, 220, 2, TileType.BRICK); // Ceiling
  
  // Entrance area
  for(let y=2; y<13; y++) set(map, 6, y, TileType.BRICK);
  
  // Early platforms and power-up (≤ 4 tiles above ground)
  placeFloatingPlatform(map, 10, 5, 4);
  set(map, 12, 9, TileType.QUESTION_BLOCK);
  placeFloatingPlatform(map, 18, 4, 3);
  
  placePipe(map, 20, 2);
  placePipe(map, 28, 3);
  
  // Broken ceiling section (warp zone area idea)
  fillRect(map, 35, 0, 10, 2, TileType.AIR); 
  
  // First pit with rescue platforms
  carveGap(map, 40, 3);
  placeFloatingPlatform(map, 40, 4, 3);
  placeFloatingPlatform(map, 46, 4, 2);
  
  // Rhythm section
  for(let offset=0; offset<3; offset++) {
    placeFloatingPlatform(map, 52 + offset * 6, 5, 2 + (offset % 2 ? 1 : 2));
  }
  for(let x=52; x<69; x+=2) set(map, 11, x, TileType.COIN);
  
  // Pipes with safe ledges
  placePipe(map, 70, 2);
  placeFloatingPlatform(map, 74, 5, 3);
  placePipe(map, 80, 4);
  placeFloatingPlatform(map, 86, 4, 4);
  placePipe(map, 90, 3);
  
  // Reward blocks
  placeFloatingPlatform(map, 95, 5, 3);
  set(map, 96, 9, TileType.QUESTION_BLOCK);
  
  // Gentle stairs
  createStair(map, 110, 3, 1);
  createStair(map, 130, 3, -1);
  
  // Late pits with platforms
  carveGap(map, 140, 2);
  placeFloatingPlatform(map, 138, 4, 2);
  carveGap(map, 150, 3);
  placeFloatingPlatform(map, 152, 4, 3);
  
  // Exit pipes and landing
  placePipe(map, 180, 4);
  placeFloatingPlatform(map, 184, 4, 3);
  placePipe(map, 200, 2);
  
  // Flag (Fake underground exit usually has pipe, but we use flag for now)
  set(map, 210, 12, TileType.HARD_BLOCK);
  fillRect(map, 210, 2, 1, 10, TileType.POLE);
  set(map, 210, 2, TileType.FLAG);
  
  // Enemies distributed per section
  const enemySlots = [25, 35, 60, 75, 92, 115, 145, 165, 190];
  enemySlots.forEach((slot, i) => {
    entities.push({
      id: 200 + i,
      type: EntityType.GOOMBA,
      pos: { x: slot * 16, y: 12 * 16 },
      vel: { x: -0.4, y: 0 },
      width: 16,
      height: 16,
      dead: false,
      grounded: false,
      direction: -1
    });
  });

  return {
    map,
    entities,
    backgroundColor: '#000000' // Black background
  };
};

// Level 1-3 (Athletic)
export const generateLevel1_3 = (): LevelData => {
  const map = createEmptyMap();
  const entities: Entity[] = [];
  
  // Base ground, later carved into gaps for athletic feel
  placeGround(map, 0, 220);
  
  const gaps = [
    { start: 18, width: 3, platformHeight: 3 },
    { start: 36, width: 2, platformHeight: 4 },
    { start: 54, width: 3, platformHeight: 3 },
    { start: 72, width: 3, platformHeight: 4 },
    { start: 96, width: 2, platformHeight: 3 },
    { start: 118, width: 3, platformHeight: 4 },
    { start: 140, width: 3, platformHeight: 3 },
    { start: 160, width: 2, platformHeight: 4 }
  ];
  
  gaps.forEach(({ start, width, platformHeight }) => {
    carveGap(map, start, width);
    placeMushroomPlatform(map, start - 1, 5, platformHeight);
  });
  
  // Additional floating bridges and coins
  placeFloatingPlatform(map, 30, 6, 3);
  placeFloatingPlatform(map, 45, 5, 4);
  placeFloatingPlatform(map, 62, 7, 3);
  placeFloatingPlatform(map, 85, 6, 4);
  placeFloatingPlatform(map, 108, 6, 3);
  placeFloatingPlatform(map, 132, 7, 4);
  placeFloatingPlatform(map, 155, 5, 3);
  placeFloatingPlatform(map, 175, 6, 3);
  
  for(let x=30; x<180; x+=10) {
    set(map, 10, x, TileType.COIN);
  }
  
  // Finish area: ensure solid approach
  placeGround(map, 180, 40);
  createStair(map, 190, 6, 1);
  
  // Flag
  set(map, 210, 12, TileType.HARD_BLOCK);
  fillRect(map, 210, 2, 1, 10, TileType.POLE);
  set(map, 210, 2, TileType.FLAG);
  set(map, 214, 12, TileType.CASTLE); 
  
  // Enemies on safe plateaus
  const athleticGoombas = [12, 28, 44, 70, 95, 122, 150, 185];
  athleticGoombas.forEach((slot, i) => {
    entities.push({
      id: 300 + i,
      type: EntityType.GOOMBA,
      pos: { x: slot * 16, y: 12 * 16 },
      vel: { x: -0.4, y: 0 },
      width: 16,
      height: 16,
      dead: false,
      grounded: false,
      direction: -1
    });
  });

  return {
    map,
    entities,
    backgroundColor: COLORS.SKY
  };
};

// Level 1-4 (Castle)
export const generateLevel1_4 = (): LevelData => {
  const map = createEmptyMap();
  const entities: Entity[] = [];
  
  // Castle interior
  placeGround(map, 0, 220, 13);
  fillRect(map, 0, 0, 220, 2, TileType.HARD_BLOCK); // Ceiling
  
  // Fill background wall pattern (optional, skipped for now for clarity)
  
  // Lava pits with safety platforms (≤ physical jump limits)
  const lavaPits = [
    { start: 22, width: 2 },
    { start: 40, width: 3 },
    { start: 60, width: 3 },
    { start: 90, width: 2 },
    { start: 130, width: 3 }
  ];
  lavaPits.forEach(({ start, width }, i) => {
    carveGap(map, start, width);
    placeFloatingPlatform(map, start - 1, width + 3, 2 + (i % 2), TileType.BRICK);
  });
  
  // Maze columns and extra obstacles
  [80, 100, 120].forEach(x => fillRect(map, x, 5, 2, 7, TileType.HARD_BLOCK));
  
  // Bowser bridge
  const bowserX = 180;
  carveGap(map, bowserX - 5, 3);
  fillRect(map, bowserX - 5, 10, 15, 1, TileType.BRICK);
  placeFloatingPlatform(map, bowserX - 2, 4, 3, TileType.HARD_BLOCK);
  
  // Axe / goal trigger
  set(map, bowserX + 10, 8, TileType.FLAG); 
  
  // Enemies (guards + fake Bowser)
  const castleGuards = [18, 32, 58, 78, 105, 135, 170];
  castleGuards.forEach((slot, i) => {
    entities.push({
      id: 900 + i,
      type: EntityType.GOOMBA,
      pos: { x: slot * 16, y: 12 * 16 },
      vel: { x: -0.35, y: 0 },
      width: 16,
      height: 16,
      dead: false,
      grounded: false,
      direction: -1
    });
  });
  
  entities.push({
    id: 999,
    type: EntityType.GOOMBA, 
    pos: { x: bowserX * 16, y: 10 * 16 },
    vel: { x: -0.4, y: 0 },
    width: 16,
    height: 16,
    dead: false,
    grounded: false,
    direction: -1
  });
  entities.push({ id: 998, type: EntityType.GOOMBA, pos: { x: (bowserX-2) * 16, y: 10 * 16 }, vel: { x: -0.4, y: 0 }, width: 16, height: 16, dead: false, grounded: false, direction: -1 });
  entities.push({ id: 997, type: EntityType.GOOMBA, pos: { x: (bowserX+2) * 16, y: 10 * 16 }, vel: { x: -0.4, y: 0 }, width: 16, height: 16, dead: false, grounded: false, direction: -1 });
  
  // Final Room
  // Just walk to right to win
  
  return {
    map,
    entities,
    backgroundColor: '#000000'
  };
};
