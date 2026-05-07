import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  // Ensure your environment.geminiApiKey is correctly set for the new project
  private genAI = new GoogleGenerativeAI(environment.geminiApiKey);

  async analyzeMealImage(base64Image: string) {
    try {
      /**
       * Using "gemini-2.5-flash" based on confirmed API capability list.
       * Explicitly using 'v1' for production stability.
       */
      const model = this.genAI.getGenerativeModel(
        { model: "gemini-2.5-flash" },
        { apiVersion: 'v1' }
      );

      // Remove prefix data:image/jpeg;base64, if present
      const pureBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

      /**
       * UPDATED PROMPT:
       * Returning standardized ERR_ codes is CRITICAL.
       * Your CameraPage UI relies on these exact strings to show the correct icons.
       */
      // Inside GeminiService.ts
const prompt = `
  Analyze this GlycoPlate image. The plate is physically divided into three sections corresponding to three IoT scales.
  
  SPATIAL MAPPING:
  - SECTION 1 (Bottom): Usually contains vegetables (e.g., Broccoli).
  - SECTION 2 (Top Left): Usually contains carbohydrates (e.g., Pasta).
  - SECTION 3 (Top Right): Usually contains proteins (e.g., Chicken).

  STRICT VALIDATION:
 STRICT VALIDATION:
  1. If image lighting is insufficient, return {"error": "ERR_LIGHT"}.
  2. If the physical plate boundaries are not visible, return {"error": "ERR_NO_PLATE"}.
  3. If food is placed in the center/middle, return {"error": "ERR_MISALIGNED"}.
  4. NON-FOOD CHECK: If an object in a section is clearly not food (e.g., electronic gadgets, clothing, toys, or empty containers), return {"error": "ERR_NON_FOOD"}.

  TASK:
  Identify the food in EACH section. If you see an object that looks like food but you are 100% unsure of its name, return the foodName as "Unknown Food" with gi: 0 and carbsPer100g: 0.
  
  REQUIRED JSON FORMAT:
  {
    "items": [
      {
        "section": 1, 
        "foodName": "string", 
        "gi": number, 
        "carbsPer100g": number
      },
      ...
    ]
  }

  IMPORTANT: 
  - Do not group different foods into one name. 
  - If Section 2 has Pasta and Section 3 has Chicken, they must be two separate objects in the "items" array.
  - If a section is empty, do not include it in the "items" array.
  - Return ONLY the JSON. No conversational text.
`;
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: pureBase64, mimeType: "image/jpeg" } }
      ]);

      const response = await result.response;
      const text = response.text();
      
      // Robust Parsing: Extract only the content between the first { and last }
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}') + 1;

      if (start === -1 || end === 0) {
        throw new Error("ERR_PARSE_FAILED");
      }

      const cleanJson = text.substring(start, end);
      return JSON.parse(cleanJson);
      
    } catch (error: any) {
      console.error("Gemini AI Error Detail:", error);
      
      // Map server-side issues to ERR_UNKNOWN to trigger the "Analysis Failed" toast correctly
      return { 
        error: error.message || "ERR_UNKNOWN",
        status: error.status || 500 
      };
    }
  }
}