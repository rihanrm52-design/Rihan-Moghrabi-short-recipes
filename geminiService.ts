
import { GoogleGenAI, Type } from "@google/genai";
import { Recipe } from "./types";

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
  
  // High-precision prompt for bilingual sync
  const prompt = `You are a professional culinary translator. Translate this recipe from ${recipe.originalLang === 'ar' ? 'Arabic' : 'Hebrew'} to ${targetLang === 'ar' ? 'Arabic' : 'Hebrew'}.
  
  STRICT RULES:
  1. Translate the Title, Ingredients, and Steps accurately.
  2. TRANSLITERATE the Author's name and the City name into the ${targetLang === 'ar' ? 'Arabic alphabet' : 'Hebrew alphabet'}. (e.g., "Ali" -> "עלי", "Haifa" -> "חיפה").
  3. Translate the PrepTime (e.g., "10 minutes" -> "10 דקות").
  4. Maintain the professional yet simple tone of a "Lazy Recipes" site.
  5. Return ONLY a valid JSON object.

  DATA TO TRANSLATE:
  Title: ${recipe.title}
  Author: ${recipe.author}
  City: ${recipe.city}
  Ingredients: ${recipe.ingredients.join('\n')}
  Steps: ${recipe.steps.join('\n')}
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
