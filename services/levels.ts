import { TileType, LevelData, EntityType, Entity } from "./types";
import { COLORS } from "./constants";

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
  
  // Platforms and obstacles
  fillRect(map, 10, 9, 5, 1, TileType.BRICK);
  set(map, 12, 5, TileType.QUESTION_BLOCK);
  
  placePipe(map, 20, 2);
  placePipe(map, 28, 3);
  
  // Broken ceiling section (warp zone area idea)
  fillRect(map, 35, 0, 10, 2, TileType.AIR); 
  
  // Pits
  for(let x=40; x<45; x++) {
    set(map, x, 13, TileType.AIR);
    set(map, x, 14, TileType.AIR);
  }
  
  // High path vs low path
  fillRect(map, 50, 7, 15, 1, TileType.BRICK);
  for(let x=50; x<65; x+=2) set(map, x, 3, TileType.COIN);
  
  // More pipes
  placePipe(map, 70, 2);
  placePipe(map, 80, 4);
  placePipe(map, 90, 3);
  
  // Starman area?
  set(map, 95, 9, TileType.BRICK);
  set(map, 96, 9, TileType.QUESTION_BLOCK);
  set(map, 97, 9, TileType.BRICK);
  
  // Stairs down
  createStair(map, 110, 4, 1);
  
  // Long straight with enemies
  
  // Exit pipe
  placePipe(map, 180, 4); // To warp zone?
  placePipe(map, 200, 2); // Normal exit
  
  // Flag (Fake underground exit usually has pipe, but we use flag for now)
  set(map, 210, 12, TileType.HARD_BLOCK);
  fillRect(map, 210, 2, 1, 10, TileType.POLE);
  set(map, 210, 2, TileType.FLAG);
  
  // Enemies (Goombas for now, should be Koopas ideally)
  for(let i=0; i<15; i++) {
    entities.push({
      id: i + 200,
      type: EntityType.GOOMBA,
      pos: { x: (20 + i * 10) * 16, y: 10 * 16 },
      vel: { x: -0.5, y: 0 },
      width: 16,
      height: 16,
      dead: false,
      grounded: false,
      direction: -1
    });
  }

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
  
  // Trees / Mushrooms platforms style
  // No continuous ground at bottom!
  
  // Starting platform
  placeGround(map, 0, 10);
  
  // Tree 1
  fillRect(map, 15, 8, 5, 1, TileType.BRICK); // Platform
  fillRect(map, 17, 9, 1, 4, TileType.HARD_BLOCK); // Trunk
  
  // Tree 2 (Higher)
  fillRect(map, 25, 6, 5, 1, TileType.BRICK);
  fillRect(map, 27, 7, 1, 6, TileType.HARD_BLOCK);
  
  // Moving platforms (simulated with static bricks for now)
  fillRect(map, 35, 8, 3, 1, TileType.BRICK);
  fillRect(map, 45, 5, 3, 1, TileType.BRICK);
  
  // Coin heaven
  for(let x=45; x<48; x++) set(map, x, 4, TileType.COIN);
  
  // Ground section
  placeGround(map, 55, 15);
  
  // Bridges
  fillRect(map, 80, 8, 10, 1, TileType.BRICK);
  
  // Tree 3
  fillRect(map, 100, 7, 5, 1, TileType.BRICK);
  fillRect(map, 102, 8, 1, 5, TileType.HARD_BLOCK);
  
  // High platform run
  fillRect(map, 120, 5, 20, 1, TileType.BRICK);
  
  // Finish area
  placeGround(map, 180, 40);
  
  // Staircase to finish
  createStair(map, 190, 8, 1);
  
  // Flag
  set(map, 210, 12, TileType.HARD_BLOCK);
  fillRect(map, 210, 2, 1, 10, TileType.POLE);
  set(map, 210, 2, TileType.FLAG);
  set(map, 214, 12, TileType.CASTLE); 
  
  // Enemies
  for(let i=0; i<10; i++) {
    entities.push({
      id: i + 300,
      type: EntityType.GOOMBA,
      pos: { x: (30 + i * 15) * 16, y: 0 }, // Drop from sky
      vel: { x: -0.5, y: 0 },
      width: 16,
      height: 16,
      dead: false,
      grounded: false,
      direction: -1
    });
  }

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
  
  // Pits with "lava" (just pits for now)
  const makeLavaPit = (x: number, w: number) => {
    for(let i=0; i<w; i++) {
      set(map, x+i, 13, TileType.AIR);
      set(map, x+i, 14, TileType.AIR);
    }
  };
  
  makeLavaPit(30, 3);
  makeLavaPit(50, 4);
  
  // Firebars (rotating) - need obstacles
  // Place blocks where firebars would be
  set(map, 40, 9, TileType.QUESTION_BLOCK);
  set(map, 60, 5, TileType.HARD_BLOCK);
  set(map, 60, 9, TileType.HARD_BLOCK);
  
  // Bowser area
  // Bridge over lava
  const bowserX = 180;
  makeLavaPit(bowserX - 5, 15);
  fillRect(map, bowserX - 5, 9, 15, 1, TileType.BRICK); // The bridge
  
  // Axe (Use a flag or coin as placeholder for now)
  set(map, bowserX + 10, 8, TileType.FLAG); 
  
  // Enemies
  // Fake Bowser (Goomba)
  entities.push({
    id: 999,
    type: EntityType.GOOMBA, // TODO: Make Bowser
    pos: { x: bowserX * 16, y: 8 * 16 },
    vel: { x: -0.5, y: 0 },
    width: 16,
    height: 16,
    dead: false,
    grounded: false,
    direction: -1
  });
  
  // Final Room
  // Just walk to right to win
  
  return {
    map,
    entities,
    backgroundColor: '#000000'
  };
};

