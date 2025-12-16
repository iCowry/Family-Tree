import { GoogleGenAI } from "@google/genai";
import { Person } from "../types";

// In a real app, this would be strictly server-side or proxy.
// For the prototype, we assume the environment variable or a safe context.
const apiKey = process.env.API_KEY || ''; 

// We initialize safely. If no key is present, we will fallback to mock responses in the UI components.
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const analyzeRelationship = async (personA: Person, personB: Person, allMembers: Person[]) => {
  if (!ai) {
    throw new Error("API Key missing");
  }

  const prompt = `
    Context: A Chinese Genealogy system (中华族谱).
    Task: Analyze the relationship between ${personA.surname}${personA.givenName} (${personA.generation}世) and ${personB.surname}${personB.givenName} (${personB.generation}世).
    
    Data:
    Person A: ${JSON.stringify(personA)}
    Person B: ${JSON.stringify(personB)}
    Relevant Ancestors: ${JSON.stringify(allMembers.filter(m => m.generation < Math.max(personA.generation, personB.generation)))}

    Requirements:
    1. Determine the exact relationship title (e.g., 堂兄, 族叔, 从孙).
    2. Determine the generation distance (e.g., "三代内", "五代内").
    3. Determine "Wu Fu" (Five Degrees of Mourning) status (e.g., "五服以内", "五服之外").
    4. Provide a very brief logic explanation.
    
    Output Format: JSON with keys: "title" (string), "generation_distance" (string), "wufu" (string), "explanation" (string).
    Example Output: { "title": "堂兄", "generation_distance": "三代内", "wufu": "五服以内", "explanation": "同祖父，不同父亲，且A比B年长。" }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini analysis failed", error);
    throw error;
  }
};

export const generateBiography = async (person: Person) => {
  if (!ai) {
    throw new Error("API Key missing");
  }

  const prompt = `
    Task: Write a short, dignified, historical-style biography (in Chinese) for a family tree member.
    Style: Classical yet readable, respectful (Traditional Chinese Tone).
    Person: ${JSON.stringify(person)}
    
    If data is sparse, generate a plausible, respectful description based on their generation context and location.
    Max 100 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini bio generation failed", error);
    throw error;
  }
};