import { GoogleGenAI } from '@google/genai';

async function listModels() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const response = await ai.models.list();
    console.log("Raw response keys:", Object.keys(response || {}));

    // Some SDK versions return an async iterable, others return an array or object
    if (Symbol.asyncIterator in Object(response)) {
      for await (const model of response) {
        console.log(`Model: ${model.name}`);
      }
    } else if (Array.isArray(response)) {
      response.forEach((m) => console.log(`Model: ${m.name || m.id}`));
    } else {
      console.log("Full response dump:", JSON.stringify(response, null, 2));
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}
