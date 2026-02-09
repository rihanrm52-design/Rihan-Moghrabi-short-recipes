
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
  
  const prompt = `You are a professional translator specializing in culinary content between Arabic and Hebrew. 
  Translate the following recipe into ${targetLang === 'ar' ? 'Arabic' : 'Hebrew'}.

  CRITICAL RULES:
  1. TITLE: Translate the recipe title.
  2. INGREDIENTS & STEPS: Translate these accurately.
  3. PREP TIME: Translate (e.g., "10 min" -> "10 דקות" or "10 دقائق").
  4. AUTHOR NAME: You MUST write the author's name using the ${targetLang === 'ar' ? 'Arabic' : 'Hebrew'} alphabet (Transliteration). Do NOT leave it in the original language.
  5. CITY NAME: You MUST write the city name using the ${targetLang === 'ar' ? 'Arabic' : 'Hebrew'} alphabet (Transliteration). For example, "חיפה" becomes "حيفا" and "جدة" becomes "ג'דה".
  6. Response MUST be a clean JSON object matching the schema.

  DATA:
  Title: ${recipe.title}
  Author: ${recipe.author}
  City: ${recipe.city}
  Ingredients: ${recipe.ingredients.join(' | ')}
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

    const parsed = JSON.parse(response.text || '{}');
    return parsed;
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    return null;
  }
}
