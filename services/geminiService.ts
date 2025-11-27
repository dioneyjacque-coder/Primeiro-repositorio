import { GoogleGenAI, Type, Modality } from "@google/genai";

// Helper to get API key safely
const getApiKey = (): string => {
  const key = process.env.API_KEY;
  if (!key) {
    console.error("API Key not found in environment");
    return "";
  }
  return key;
};

// 1. Fast AI Responses (Gemini 2.5 Flash Lite)
export const askFastQuery = async (prompt: string, appContext: string = ""): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const fullPrompt = appContext 
      ? `CONTEXTO DO APLICATIVO (Use estas informações para responder se relevante):\n${appContext}\n\nPERGUNTA DO USUÁRIO:\n${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest',
      contents: fullPrompt,
    });
    return response.text || "Sem resposta.";
  } catch (error) {
    console.error("Fast Query Error:", error);
    return "Erro ao processar consulta rápida.";
  }
};

// 2. Maps Grounding (Gemini 2.5 Flash + Google Maps)
export const askWithMaps = async (prompt: string, userLocation?: {lat: number, lng: number}, appContext: string = ""): Promise<{text: string, sources: Array<{uri: string, title: string}>}> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const toolConfig: any = {};
    if (userLocation) {
      toolConfig.retrievalConfig = {
        latLng: {
          latitude: userLocation.lat,
          longitude: userLocation.lng
        }
      };
    }

    const fullPrompt = appContext 
      ? `CONTEXTO DO APLICATIVO:\n${appContext}\n\nPERGUNTA DO USUÁRIO:\n${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: toolConfig,
      }
    });

    const sources: Array<{uri: string, title: string}> = [];
    
    // Extract grounding chunks
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
           sources.push({ uri: chunk.web.uri, title: chunk.web.title || "Link Web" });
        }
        if (chunk.maps?.uri) {
           // Extract specific maps data if available
           sources.push({ uri: chunk.maps.uri, title: chunk.maps.title || "Google Maps" });
        }
      });
    }

    return {
      text: response.text || "Não foi possível encontrar informações de mapa.",
      sources
    };
  } catch (error) {
    console.error("Maps Query Error:", error);
    return { text: "Erro ao consultar mapas.", sources: [] };
  }
};

// 3. Image Analysis (Gemini 3 Pro)
export const analyzeScheduleImage = async (base64Image: string, promptText: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', 
              data: base64Image
            }
          },
          { text: promptText || "Analise esta imagem de um horário de lancha e extraia os dados. Se possível, formate como JSON ou lista clara." }
        ]
      }
    });
    return response.text || "Não consegui analisar a imagem.";
  } catch (error) {
    console.error("Image Analysis Error:", error);
    return "Erro ao analisar imagem.";
  }
};

// 4. Thinking Mode (Gemini 3 Pro + Thinking Budget)
export const askWithThinking = async (prompt: string, appContext: string = ""): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const fullPrompt = appContext 
      ? `CONTEXTO COMPLETO DO SISTEMA:\n${appContext}\n\nTAREFA DO USUÁRIO:\n${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: fullPrompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 },
      }
    });
    return response.text || "Sem resposta do modelo de pensamento.";
  } catch (error) {
    console.error("Thinking Mode Error:", error);
    return "Erro ao processar com modo de pensamento.";
  }
};

// 5. Audio Transcription (Gemini 2.5 Flash)
export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/webm', // Or the mime type recorded
              data: base64Audio
            }
          },
          { text: "Transcreva este áudio sobre horários de lanchas. Responda apenas com a transcrição exata." }
        ]
      },
      config: {
          responseModalities: [Modality.TEXT]
      }
    });
    return response.text || "Falha na transcrição.";
  } catch (error) {
    console.error("Transcription Error:", error);
    return "Erro ao transcrever áudio.";
  }
};