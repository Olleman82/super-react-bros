
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

  try {
    console.log('[GeminiService] Skickar begäran till Gemini...');
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a Super Mario Bros style level map that closely follows the original game's design principles.
      The map should be a 2D array of integers (15 rows x 150 columns).
      
      Tile Mapping:
      0: Air (empty space)
      1: Ground (solid brown ground tile)
      2: Brick (breakable brick block)
      3: Question Block (contains power-ups or coins)
      4: Pipe Body Left
      5: Hard Block (indestructible gray block)
      6: Pipe Top Left
      7: Pipe Top Right
      8: Pipe Body Right
      9: Pipe Body (full)
      10: Pole (flagpole)
      11: Flag (at top of pole)
      12: Coin (floating coin, rarely used in map - coins usually come from blocks)
      
      Provide a JSON object with:
      - map: number[][] (15 rows x 150 columns)
      - enemyPositions: {x: number, y: number, type: string}[] (x and y in pixels, not tiles)
      
      CRITICAL DESIGN RULES (based on original Super Mario Bros):
      
      1. GROUND LEVEL:
      - Rows 13 and 14 (bottom 2 rows) MUST be mostly type 1 (Ground) to form the main ground level
      - Add occasional pits (type 0) for challenge, but ensure Mario can always progress
      - First 10 columns MUST have solid ground (no pits) so Mario starts safely
      
      2. MARIO START POSITION:
      - Mario starts at x=50 pixels (approximately column 3)
      - Ensure columns 0-5 have solid ground (type 1) in rows 13-14
      - Mario should start on safe ground, not over a pit
      
      3. ENEMY PLACEMENT LOGIC:
      - Place 15-25 enemies throughout the level for good gameplay
      - Enemies MUST be placed on actual ground level (rows 13-14, tile type 1)
      - Enemy Y position should be: (row 13 or 14) * 16 - 16 (one tile above ground)
      - NEVER place enemies inside blocks, below ground level, or floating in air
      - Distribute enemies evenly: 3-5 enemies per 30-column section
      - Use type "goomba" for all enemies
      - Place enemies on flat ground sections, not in pits
      
      4. QUESTION BLOCKS (type 3) - Power-up Logic:
      - Place 8-12 Question Blocks throughout the level
      - Early in level (columns 0-50): Place 2-3 Mushroom blocks (these give Mario Super Mario)
      - Middle of level (columns 50-100): Place 3-4 Coin blocks and 1-2 Flower blocks
      - Later in level (columns 100-150): Place 2-3 Flower blocks (Fire Flower for advanced players)
      - Place Question Blocks on platforms above ground, typically at row 9-11 (2-4 tiles high)
      - Group Question Blocks in sets of 2-3 for visual appeal
      - Create platforms with bricks (type 2) below Question Blocks so Mario can reach them
      
      5. BRICK BLOCKS (type 2):
      - Place 20-30 brick blocks throughout the level to create platforms
      - Create multiple platforms at different heights (rows 9-12)
      - Build staircases: start low and go higher, or create elevated paths
      - Place bricks in rows 8-12 to create jumpable platforms
      - Small Mario can't break bricks, but Big/Fire Mario can
      - Create at least 5-7 distinct platform areas for Mario to explore
      
      6. COINS:
      - Coins are INSIDE Question Blocks (not as map tiles)
      - Most Question Blocks (60-70%) should contain coins
      - The remaining Question Blocks contain power-ups (Mushroom/Flower)
      - This ensures good coin collection gameplay
      
      7. PIPES:
      - Place 2-4 pipes throughout the level as obstacles
      - Pipes must be placed ON TOP OF ground (type 1) in rows 13-14
      - Use tiles 6 and 7 for pipe tops (left and right)
      - Use tiles 4 and 8 for pipe body sides
      - Pipes should be 2-4 tiles tall (rows 10-13 or 9-13)
      - Place pipes strategically to create obstacles and force jumps
      - Space pipes out: one every 30-40 columns
      
      8. DECORATIVE ELEMENTS (for visual variety):
      - Use tile 14 (CLOUD) in rows 2-4 for background decoration
      - Use tile 15 (BUSH) in row 12 for ground-level decoration
      - Use tile 16 (HILL) in rows 10-11 for background hills
      - Place decorative elements every 15-20 columns for visual interest
      - These don't affect gameplay but make the level look authentic
      
      9. FLAG AND POLE:
      - Place pole (type 10) at column 145 (x=145)
      - Pole should extend from row 2 to row 13 (ground level)
      - Place flag (type 11) at row 2, column 145
      - Ensure ground exists at the base of the pole (row 13-14, column 145)
      - Mario should be able to jump and touch the flag to complete the level
      
      10. LEVEL PROGRESSION AND DENSITY:
      - Start easy (columns 0-30): Simple ground, 3-4 enemies, 1-2 Question Blocks, 1 platform
      - Build up (columns 30-80): More platforms, 6-8 enemies, 3-4 Question Blocks, 1-2 pipes
      - Peak difficulty (columns 80-130): Complex platforming, 8-10 enemies, 4-5 Question Blocks, 1-2 pipes
      - Final section (columns 130-150): Lead to flag, 2-3 enemies, 1 Question Block
      - Create variety: mix of ground running and platforming sections
      - Ensure all platforms are reachable with Mario's jump height
      
      11. CONTENT DENSITY REQUIREMENTS:
      - Minimum 20-30 brick blocks for platforms
      - Minimum 8-12 Question Blocks
      - Minimum 15-25 enemies
      - Minimum 2-4 pipes
      - Decorative elements (clouds, bushes, hills) every 15-20 columns
      - The level should feel FULL and engaging, not empty
      
      Remember: This should feel like an authentic Super Mario Bros level with proper power-up placement, enemy positioning, varied platforming, and rich visual content. The level should be FUN to play with lots of things to explore and collect!`,
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
      // Note: Not logging fullText to avoid exposing sensitive data
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
      sampleMapData: data.map ? {
        firstRow: data.map[0]?.slice(0, 10),
        lastRow: data.map[data.map.length - 1]?.slice(0, 10),
        row13: data.map[13]?.slice(0, 10),
        row14: data.map[14]?.slice(0, 10)
      } : null
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

    // Log validated map info
    console.log('[GeminiService] Validerad karta:', {
      rows: validatedMap.length,
      cols: validatedMap[0]?.length,
      entitiesCount: validatedEntities.length,
      sampleValidatedData: {
        firstRow: validatedMap[0]?.slice(0, 10),
        lastRow: validatedMap[validatedMap.length - 1]?.slice(0, 10),
        row13: validatedMap[13]?.slice(0, 10),
        row14: validatedMap[14]?.slice(0, 10)
      },
      nonZeroTiles: validatedMap.flat().filter(t => t !== 0).length,
      totalTiles: validatedMap.flat().length
    });

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
