
import { GoogleGenAI, Type } from "@google/genai";
import { LevelData, TileType, EntityType } from "../types";

// Helper function to find ground level at a given x position
const findGroundLevel = (map: number[][], x: number): number => {
  const TILE_SIZE = 16;
  const GROUND_TILES = [1, 2, 3, 4, 5, 6, 7, 8, 9]; // All solid tiles
  
  // Check from bottom up
  for (let y = map.length - 1; y >= 0; y--) {
    if (map[y] && GROUND_TILES.includes(map[y][x])) {
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
  });
  
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
      - Enemies MUST be placed on ground level (same Y as ground tiles in rows 13-14)
      - Enemy Y position should be: groundY * 16 - 16 (one tile above ground)
      - NEVER place enemies below ground level or floating in air
      - Place enemies on platforms that Mario can reach
      - Use type "goomba" for all enemies
      - Distribute enemies evenly throughout the level
      
      4. QUESTION BLOCKS (type 3) - Power-up Logic:
      - Early in level (x < 50): Place Mushroom blocks (these give Mario Super Mario)
      - Middle of level (x 50-100): Mix of Coin blocks and occasional Flower blocks
      - Later in level (x > 100): More Flower blocks (Fire Flower for advanced players)
      - Place Question Blocks on platforms above ground, typically 2-4 tiles high
      - Group Question Blocks in sets of 2-3 for visual appeal
      
      5. BRICK BLOCKS (type 2):
      - Place in patterns above ground level
      - Create platforms for Mario to jump on
      - Use bricks to create staircases and elevated paths
      - Small Mario can't break bricks, but Big/Fire Mario can
      
      6. COINS:
      - Coins are usually INSIDE Question Blocks (not as map tiles)
      - If using coin tiles (type 12), place them in patterns above ground
      - Coins should form paths that guide the player
      - Place coins in rows 5-10, not at ground level
      
      7. PIPES:
      - Pipes must be placed ON TOP OF ground (type 1)
      - Use tiles 6 and 7 for pipe tops (left and right)
      - Use tiles 4 and 8 for pipe body sides
      - Pipes should be 2-4 tiles tall
      - Place pipes strategically to create obstacles
      
      8. FLAG AND POLE:
      - Place pole (type 10) at x=145 (column 145)
      - Pole should extend from row 2 to row 13 (ground level)
      - Place flag (type 11) at row 2, column 145
      - Ensure ground exists at the base of the pole (row 13-14, column 145)
      - Mario should be able to jump and touch the flag to complete the level
      
      9. LEVEL PROGRESSION:
      - Start easy: simple ground, few enemies
      - Build difficulty: add platforms, more enemies, pits
      - Create variety: mix of ground running and platforming sections
      - End with flag accessible via jump or platform
      
      10. VISUAL CONSISTENCY:
      - Follow original game patterns: ground sections, then platforms, then more complex areas
      - Use bricks and question blocks to create interesting vertical gameplay
      - Ensure all platforms are reachable with Mario's jump height
      
      Remember: This should feel like an authentic Super Mario Bros level with proper power-up placement, enemy positioning, and level flow.`,
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
                }
              }
            }
          }
        }
      }
    });

    console.log('[GeminiService] Fick svar från Gemini:', {
      hasText: !!response.text,
      textLength: response.text?.length,
      textPreview: response.text?.substring(0, 200),
      fullText: response.text // Log full response for debugging
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
