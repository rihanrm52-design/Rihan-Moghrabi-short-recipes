import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from "./types";

// Note: GoogleGenAI client is initialized inside each function call as per the latest guidelines.

export async function generateQuickRecipe(title: string, lang: 'ar' | 'he') {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const prompt = lang === 'ar' 
    ? `اقترح وصفة سريعة جداً للكسالى بعنوان: "${title}". اجعل المكونات قليلة والخطوات بسيطة جداً. أعد النتيجة بتنسيق JSON.`
    : `הצע מתכון מהיר מאוד לעצלנים בשם: "${title}". וודא שיש מעט מצרכים ושלבים פשוטים מאוד. החזר תוצאה בפורמט JSON.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            prepTime: { type: Type.STRING }
          },
          required: ["ingredients", "steps", "prepTime"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return null;
  }
}

export async function translateRecipeContent(recipe: Recipe, targetLang: 'ar' | 'he') {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';
  const prompt = `Translate the following recipe to ${targetLang === 'ar' ? 'Arabic' : 'Hebrew'}. 
  IMPORTANT: Also translate the Author's name and the City name to the target language script.
  Return as JSON.
  
  Title: ${recipe.title}
  Author: ${recipe.author}
  City: ${recipe.city}
  Ingredients: ${recipe.ingredients.join(', ')}
  Steps: ${recipe.steps.join(' | ')}
  PrepTime: ${recipe.prepTime}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            city: { type: Type.STRING },
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            prepTime: { type: Type.STRING }
          },
          required: ["title", "author", "city", "ingredients", "steps", "prepTime"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    return null;
  }
}