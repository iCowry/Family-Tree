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
    Context: A Chinese Genealogy system.
    Task: Analyze the relationship between two family members: ${personA.surname}${personA.givenName} and ${personB.surname}${personB.givenName}.
    
    Data:
    Person A: ${JSON.stringify(personA)}
    Person B: ${JSON.stringify(personB)}
    Relevant Ancestors (Subset): ${JSON.stringify(allMembers.filter(m => m.generation < Math.max(personA.generation, personB.generation)))}

    Please provide:
    1. The specific relationship title in Chinese (e.g., 堂兄, 从叔).
    2. A brief calculation explanation (e.g., "Person A is the son of X, who is the brother of Person B's father...").
    3. The "Wu Fu" (Five Degrees of Mourning) status if applicable.
    
    Output Format: JSON with keys: "title", "explanation", "wufu".
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