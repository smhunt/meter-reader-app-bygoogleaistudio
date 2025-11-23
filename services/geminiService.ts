import { GoogleGenAI, Type } from "@google/genai";

// Initialize the client
// NOTE: API_KEY must be provided in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface AnalysisResult {
  value: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

export const analyzeMeterImage = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    // Detect mime type and extract data
    // Data URL format: data:[<mediatype>][;base64],<data>
    const matches = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    
    let mimeType = "image/jpeg";
    let cleanBase64 = base64Image;

    if (matches && matches.length === 3) {
      mimeType = matches[1];
      cleanBase64 = matches[2];
    } else {
      // Fallback if regex doesn't match standard data URI pattern
      cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: `Analyze this water meter image and extract the numerical reading.
            
            CRITICAL VISUAL STRUCTURE (STRICT RULES):
            1. **The Anchor**: Locate the Single White Digit on a Black Background. This is the TENTHS place.
            2. **The Integers**: To the LEFT of the tenths digit, there are EXACTLY FIVE (5) Black Digits on a White Background. You MUST find all 5.
            
            READING INSTRUCTIONS:
            - **Integer Part**: Read the 5 black digits. Do not miss the 5th digit (the ones place) which is right next to the black tenths dial.
            - **Decimal Part**: Read the single white digit on the black background.
            
            ROLLING/TUMBLING LOGIC (PRECISION MODE):
            - The white-on-black tenths digit often rolls continuously.
            - **Centered**: If the digit (e.g., '8') is centered, the decimal is '.80'.
            - **Rolling**: If the dial is halfway between two numbers (e.g., leaving '8' and entering '9'), read this as '.85'.
            - **Example**: 
              - 5 Black digits: "02268"
              - 1 White digit: Rolling between 8 and 9.
              - Result: "02268.85"
            
            OUTPUT FORMAT:
            - Return a JSON object containing:
              - reading: string "XXXXX.XX" (5 integers, 2 decimal places).
              - confidence: number (0-100).
              - box: object with ymin, xmin, ymax, xmax (bounding box of the entire detected reading area, normalized 0-1000).
            `
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reading: {
              type: Type.STRING,
              description: "The formatted meter reading string (e.g. '02268.85').",
            },
            confidence: {
              type: Type.NUMBER,
              description: "A confidence score from 0 to 100.",
            },
            box: {
              type: Type.OBJECT,
              description: "The bounding box coordinates of the detected reading area, normalized to 1000x1000.",
              properties: {
                ymin: { type: Type.NUMBER },
                xmin: { type: Type.NUMBER },
                ymax: { type: Type.NUMBER },
                xmax: { type: Type.NUMBER }
              },
              required: ["ymin", "xmin", "ymax", "xmax"]
            }
          },
          required: ["reading", "confidence", "box"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      return {
        value: result.reading || "00000.00",
        confidence: result.confidence || 0,
        boundingBox: result.box
      };
    }
    
    throw new Error("No text response from model");

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    return {
      value: "ERROR",
      confidence: 0
    };
  }
};