import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateInsights(salesData: any[]) {
  try {
    const prompt = `
      Analyze the following sales data and provide 3 key insights and 1 recommendation for the store owner.
      Data: ${JSON.stringify(salesData.slice(0, 20))}
      
      Format the response as JSON with keys: "insights" (array of strings) and "recommendation" (string).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("AI Error:", error);
    return {
      insights: ["Unable to generate insights at this time."],
      recommendation: "Check your connection and try again."
    };
  }
}
