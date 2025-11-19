
import { GoogleGenAI, Type } from "@google/genai";
import { LevelData, TileType, EntityType } from "../types";

// Helper function to find ground level at a given x position
// Returns the row index of the actual ground level (rows 13-14), not blocks above
const findGroundLevel = (map: number[][], x: number): number => {
  const TILE_SIZE = 16;
  const GROUND_TILE = 1; // Only actual ground, not blocks
  
  // First check rows 13-14 (the actual ground level)
  for (let y = map.length - 1; y >= map.length - 2; y--) {
    if (map[y] && map[y][x] === GROUND_TILE) {
      return y;
    }
  }
  
  // If no ground found in bottom rows, check all rows from bottom up
  for (let y = map.length - 1; y >= 0; y--) {
    if (map[y] && map[y][x] === GROUND_TILE) {
      return y;
    }
  }
  
  // Default to bottom row if no ground found
  return map.length - 1;
};

// Helper function to validate and fix the generated level
const validateAndFixLevel = (map: number[][], enemyPositions: any[]): { map: number[][], entities: any[] } => {
  console.log('[validateAndFixLevel] Startar validering:', {
    mapHeight: map.length,
    mapWidth: map[0]?.length,
    enemyPositionsCount: enemyPositions.length
  });
  
  const TILE_SIZE = 16;
  const GROUND_TILES = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const MAP_HEIGHT = map.length;
  const MAP_WIDTH = map[0]?.length || 150;
  
  // Ensure map has correct dimensions
  if (!map || map.length === 0 || !map[0] || map[0].length === 0) {
    console.error('[validateAndFixLevel] Kartan är tom eller har fel dimensioner!');
    // Create a basic map as fallback
    const fallbackMap: number[][] = [];
    for (let y = 0; y < 15; y++) {
      fallbackMap[y] = [];
      for (let x = 0; x < 150; x++) {
        if (y >= 13) {
          fallbackMap[y][x] = 1; // Ground
        } else {
          fallbackMap[y][x] = 0; // Air
        }
      }
    }
    map = fallbackMap;
    console.log('[validateAndFixLevel] Skapade fallback-karta');
  }
  
  // Ensure bottom rows have ground for Mario's starting position
  // Make sure first 5 columns have solid ground
  for (let x = 0; x < 5; x++) {
    for (let y = MAP_HEIGHT - 2; y < MAP_HEIGHT; y++) {
      if (map[y] && map[y][x] === 0) {
        map[y][x] = 1; // Ground
      }
    }
  }
  
  console.log('[validateAndFixLevel] Efter startposition-fix:', {
    startArea: map.slice(MAP_HEIGHT - 2).map(row => row.slice(0, 5))
  });
  
  // Fix enemies to be on ground level
  const fixedEntities = enemyPositions.map((e, i) => {
    const tileX = Math.floor(e.x / TILE_SIZE);
    const groundY = findGroundLevel(map, tileX);
    const groundPixelY = groundY * TILE_SIZE;
    
    // Ensure enemy is placed on top of actual ground, not inside blocks
    // Check that the tile above ground is air (not a block)
    const tileAboveGround = groundY - 1;
    if (tileAboveGround >= 0 && map[tileAboveGround] && map[tileAboveGround][tileX] !== 0) {
      // There's a block above ground, skip this enemy or place it further right
      console.warn(`[validateAndFixLevel] Fiende ${i} skulle hamna i block vid x=${tileX}, hoppar över eller flyttar`);
      // Try to find a nearby safe spot
      let safeX = tileX;
      for (let offset = 1; offset <= 3; offset++) {
        const checkX = Math.min(tileX + offset, MAP_WIDTH - 1);
        const checkGroundY = findGroundLevel(map, checkX);
        const checkTileAbove = checkGroundY - 1;
        if (checkTileAbove >= 0 && map[checkTileAbove] && map[checkTileAbove][checkX] === 0) {
          safeX = checkX;
          break;
        }
      }
      const safeGroundY = findGroundLevel(map, safeX);
      const safeGroundPixelY = safeGroundY * TILE_SIZE;
      return {
        id: i + 1000,
        type: EntityType.GOOMBA,
        pos: { x: safeX * TILE_SIZE, y: safeGroundPixelY - 16 },
        vel: { x: -0.5, y: 0 },
        width: 16,
        height: 16,
        dead: false,
        grounded: false,
        direction: -1
      };
    }
    
    // Place enemy on top of ground (one tile above)
    return {
      id: i + 1000,
      type: EntityType.GOOMBA,
      pos: { x: e.x, y: groundPixelY - 16 }, // One tile above ground
      vel: { x: -0.5, y: 0 },
      width: 16,
      height: 16,
      dead: false,
      grounded: false,
      direction: -1
    };
  }).filter(e => {
    // Filter out enemies that would be placed in invalid positions
    const tileX = Math.floor(e.pos.x / TILE_SIZE);
    const tileY = Math.floor(e.pos.y / TILE_SIZE);
    // Make sure enemy is not inside a solid block
    if (tileY >= 0 && tileY < MAP_HEIGHT && map[tileY] && GROUND_TILES.includes(map[tileY][tileX])) {
      console.warn(`[validateAndFixLevel] Fiende skulle hamna i block vid (${tileX}, ${tileY}), filtrerar bort`);
      return false;
    }
    return true;
  });
  
  console.log('[validateAndFixLevel] Efter fiende-fix:', {
    originalCount: enemyPositions.length,
    fixedCount: fixedEntities.length
  });
  
  // If no enemies were provided or all were filtered out, generate some default enemies
  if (fixedEntities.length === 0) {
    console.warn('[validateAndFixLevel] Inga fiender från AI, genererar standard-fiender...');
    const defaultEnemyCount = 20;
    for (let i = 0; i < defaultEnemyCount; i++) {
      const x = Math.floor((i + 1) * (MAP_WIDTH / (defaultEnemyCount + 1)));
      const groundY = findGroundLevel(map, x);
      const groundPixelY = groundY * TILE_SIZE;
      
      // Check that there's no block above ground
      const tileAboveGround = groundY - 1;
      if (tileAboveGround >= 0 && map[tileAboveGround] && map[tileAboveGround][x] === 0) {
        fixedEntities.push({
          id: 2000 + i,
          type: EntityType.GOOMBA,
          pos: { x: x * TILE_SIZE, y: groundPixelY - 16 },
          vel: { x: -0.5, y: 0 },
          width: 16,
          height: 16,
          dead: false,
          grounded: false,
          direction: -1
        });
      }
    }
    console.log('[validateAndFixLevel] Genererade', fixedEntities.length, 'standard-fiender');
  }
  
  // Ensure flag exists at the end
  const flagX = MAP_WIDTH - 5;
  const flagY = MAP_HEIGHT - 3; // Above ground level
  
  // Place pole
  if (map[flagY]) {
    for (let y = flagY; y < MAP_HEIGHT - 1; y++) {
      if (map[y]) map[y][flagX] = 10; // Pole
    }
    // Place flag at top of pole
    if (map[flagY - 1]) map[flagY - 1][flagX] = 11; // Flag
  }
  
  return { map, entities: fixedEntities };
};

export const generateLevel = async (apiKey: string): Promise<LevelData | null> => {
  if (!apiKey) {
    console.warn("No API Key provided for Gemini");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  // Randomize level style and parameters
  const styles = [
    { name: "Classic", description: "Standard Super Mario Bros 1-1 style. Balanced ground and platforms." },
    { name: "Hilly", description: "Lots of hills, verticality, and elevated ground sections. Less flat ground." },
    { name: "Athletic", description: "Many platforms, gaps, and jumps. Less solid ground at the bottom." },
    { name: "Broken", description: "Fragmented ground, many small islands, requires precise jumping." }
  ];
  
  const selectedStyle = styles[Math.floor(Math.random() * styles.length)];
  const seed = Math.floor(Math.random() * 1000000);

  try {
    console.log(`[GeminiService] Skickar begäran till Gemini (Style: ${selectedStyle.name}, Seed: ${seed})...`);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a Super Mario Bros style level map.
      Style: ${selectedStyle.name} - ${selectedStyle.description}
      Random Seed: ${seed}
      
      The map should be a 2D array of integers (15 rows x 150 columns).
      
      Tile Mapping (Must match game engine constants):
      0: Air (empty space)
      1: Ground (solid brown ground tile)
      2: Brick (breakable brick block)
      3: Question Block (contains power-ups or coins)
      5: Hard Block (indestructible gray block)
      6: Pipe Body Left (vertical pipe segment, left side)
      7: Pipe Body Right (vertical pipe segment, right side)
      8: Pipe Top Left (top left corner of pipe)
      9: Pipe Top Right (top right corner of pipe)
      10: Pole (flagpole)
      11: Flag (at top of pole)
      12: Coin (floating coin)
      14: Cloud (in sky)
      15: Bush (on ground)
      16: Hill (background hill)
      
      Provide a JSON object with:
      - map: number[][] (15 rows x 150 columns)
      - enemyPositions: {x: number, y: number, type: string}[] (x and y in pixels, not tiles)
      
      CRITICAL DESIGN RULES:
      
      1. DYNAMIC TERRAIN:
      - DO NOT make the level just flat ground at the bottom.
      - Vary the ground height. Use hills, pits, and floating islands.
      - In "Hilly" or "Athletic" styles, the main path can be elevated (rows 8-10).
      - Ensure columns 0-10 have solid ground at row 13-14 for a safe start.
      
      2. MARIO START POSITION:
      - Mario starts at x=50 pixels (column 3).
      - Ensure the starting area is safe.
      
      3. ENEMY PLACEMENT:
      - Place 15-25 enemies (Goombas).
      - Enemies must be on solid blocks (Ground, Brick, or Hard Block).
      - DO NOT place enemies in the air or inside blocks.
      - Distribute them throughout the level.
      
      4. PLATFORMS AND OBSTACLES:
      - Use Brick Blocks (2) and Question Blocks (3) to create platforms.
      - Create staircases and elevated paths.
      - Place Pipes (tiles 6,7,8,9) on top of ground sections.
      
      5. PLAYABILITY:
      - Ensure all jumps are possible (Mario can jump about 4-5 tiles high and 3-4 tiles wide).
      - Avoid "soft locks" where Mario falls into a deep pit he cannot escape from (unless it's a death pit).
      
      6. DECORATION:
      - Use occasional clouds (tile 14, implied logic) or hills (tile 16) if you want, but focus on the gameplay blocks first.
      
      7. FLAG:
      - Place a flagpole at the end (column 145).
      
      Make the level feel ORGANIC and NON-REPETITIVE. Avoid simple repeating patterns.
      
      Style Specific Instructions:
      ${selectedStyle.name === "Classic" ? "- Balance between running and jumping. Classic 1-1 feel." : ""}
      ${selectedStyle.name === "Hilly" ? "- Create rolling hills. Ground level should oscillate between row 14 and row 8." : ""}
      ${selectedStyle.name === "Athletic" ? "- Focus on platforming. Use floating islands of ground. Many gaps." : ""}
      ${selectedStyle.name === "Broken" ? "- The ground is broken. Lots of small pits and small platforms. High difficulty." : ""}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            map: {
              type: Type.ARRAY,
              items: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER }
              }
            },
            enemyPositions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  x: { type: Type.INTEGER },
                  y: { type: Type.INTEGER },
                  type: { type: Type.STRING }
                },
                required: ['x', 'y', 'type']
              }
            }
          },
          required: ['map', 'enemyPositions']
        }
      }
    });

    console.log('[GeminiService] Fick svar från Gemini:', {
      hasText: !!response.text,
      textLength: response.text?.length,
      textPreview: response.text?.substring(0, 200)
    });

    if (!response.text) {
      console.error('[GeminiService] Inget text-svar från Gemini!');
      return null;
    }

    let data;
    try {
      data = JSON.parse(response.text);
    } catch (parseError) {
      console.error('[GeminiService] Kunde inte parsa JSON från Gemini:', parseError);
      console.error('[GeminiService] Raw text:', response.text);
      return null;
    }
    
    console.log('[GeminiService] Raw AI response:', {
      hasMap: !!data.map,
      mapType: typeof data.map,
      mapLength: data.map?.length,
      mapFirstRowLength: data.map?.[0]?.length,
      hasEnemyPositions: !!data.enemyPositions,
      enemyPositionsCount: data.enemyPositions?.length || 0,
      style: selectedStyle.name
    });
    
    if (!data.map) {
      console.error('[GeminiService] Ingen karta i AI-svar!');
      return null;
    }

    // Validate and fix the generated level
    console.log('[GeminiService] Validerar och fixar bana...');
    const { map: validatedMap, entities: validatedEntities } = validateAndFixLevel(
      data.map,
      data.enemyPositions || []
    );

    return {
      map: validatedMap,
      entities: validatedEntities,
      backgroundColor: '#5C94FC'
    };

  } catch (e) {
    console.error("Failed to generate level", e);
    return null;
  }
};
