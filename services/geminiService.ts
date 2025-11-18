
import { GoogleGenAI, Type } from "@google/genai";
import { LevelData, TileType, EntityType } from "../types";

export const generateLevel = async (apiKey: string): Promise<LevelData | null> => {
  if (!apiKey) {
    console.warn("No API Key provided for Gemini");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a Super Mario Bros style level map. 
      The map should be a 2D array of integers (15 rows x 150 columns).
      
      Mapping:
      0: Air
      1: Ground (Solid)
      2: Brick
      3: Question Block
      4: Pipe Body
      5: Hard Block
      6: Pipe Top Left
      7: Pipe Top Right
      10: Pole
      11: Flag
      12: Coin

      Provide a JSON object with:
      - map: number[][]
      - enemyPositions: {x: number, y: number, type: string}[]
      
      Rules:
      - Bottom 2 rows (rows 13 and 14) MUST be mostly type 1 (Ground), but add some pits (0) for challenge.
      - Place a flag and pole at the very end (x=145).
      - Add varied platforming height using Bricks (2) and Questions (3).
      - Place pipes (Body 4, Tops 6/7) on top of ground.
      `,
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

    const data = JSON.parse(response.text || "{}");
    if (!data.map) return null;

    return {
      map: data.map,
      entities: (data.enemyPositions || []).map((e: any, i: number) => ({
        id: i + 1000,
        type: EntityType.GOOMBA, // Defaulting mostly to Goombas for simplicity
        pos: { x: e.x * 16, y: e.y * 16 },
        vel: { x: -0.5, y: 0 },
        width: 16,
        height: 16,
        dead: false,
        grounded: false,
        direction: -1
      })),
      backgroundColor: '#5C94FC'
    };

  } catch (e) {
    console.error("Failed to generate level", e);
    return null;
  }
};
