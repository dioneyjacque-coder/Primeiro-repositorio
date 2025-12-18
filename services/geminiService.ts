
import { GoogleGenAI, Type } from "@google/genai";

// Helper to handle API errors and retry logic
const handleGenAIError = (error: unknown): string => {
  console.error("Gemini API Error:", error);
  const msg = error instanceof Error ? error.message : String(error);
  
  if (msg.includes("400") || msg.includes("API key") || msg.includes("API_KEY_INVALID") || msg.includes("403")) {
    return "Erro: Chave de API inválida ou não configurada. Por favor, configure sua chave de acesso clicando no ícone de chave.";
  }
  return `Erro ao processar consulta: ${msg}`;
};

// 1. Fast AI Responses (Gemini 3 Flash)
// Standard text task using gemini-3-flash-preview
export const askFastQuery = async (prompt: string, appContext: string = ""): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const fullPrompt = appContext 
      ? `DADOS DO APLICATIVO:\n${appContext}\n\nPERGUNTA DO USUÁRIO:\n${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: fullPrompt,
      config: {
        systemInstruction: "Você é o assistente oficial do app 'NavegaAmazonas'. Sua função é ajudar usuários a encontrar horários de lanchas, itinerários e informações sobre transporte fluvial no Amazonas. Use estritamente os dados fornecidos no contexto para responder. Se a informação não estiver nos dados, diga que não encontrou. Seja prestativo, educado e conciso.",
      }
    });
    return response.text || "Sem resposta do assistente.";
  } catch (error) {
    return handleGenAIError(error);
  }
};

// 2. Maps Grounding (Gemini 2.5 Flash + Google Maps)
// Maps grounding is only supported in Gemini 2.5 series models
export const askWithMaps = async (prompt: string, userLocation?: {lat: number, lng: number}, appContext: string = ""): Promise<{text: string, sources: Array<{uri: string, title: string}>}> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
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
      ? `CONTEXTO DO APP:\n${appContext}\n\nPERGUNTA:\n${prompt}`
      : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: toolConfig,
        systemInstruction: "Você é um assistente de viagens fluviais. Use o Google Maps para encontrar distâncias e locais, mas priorize os dados de lanchas fornecidos no contexto do aplicativo."
      }
    });

    const sources: Array<{uri: string, title: string}> = [];
    
    // Extract grounding chunks for Maps
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
           sources.push({ uri: chunk.web.uri, title: chunk.web.title || "Link Web" });
        }
        if (chunk.maps?.uri) {
           sources.push({ uri: chunk.maps.uri, title: chunk.maps.title || "Google Maps" });
        }
      });
    }

    return {
      text: response.text || "Não foi possível encontrar informações de mapa.",
      sources
    };
  } catch (error) {
    return { text: handleGenAIError(error), sources: [] };
  }
};

// 3. Image Analysis (Gemini 3 Pro)
// High-quality image task using gemini-3-pro-preview
export const analyzeScheduleImage = async (base64Image: string, promptText: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
          { text: promptText || "Analise esta imagem de um horário de lancha e extraia os dados. Liste: Nome da Lancha, Horários, Dias de Saída e Destinos. Formate como texto claro." }
        ]
      }
    });
    return response.text || "Não consegui analisar a imagem.";
  } catch (error) {
    return handleGenAIError(error);
  }
};

// 4. Thinking Mode (Gemini 3 Pro + Thinking Budget)
// Advanced reasoning task using gemini-3-pro-preview
export const askWithThinking = async (prompt: string, appContext: string = ""): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const fullPrompt = appContext 
      ? `DADOS COMPLETOS DO SISTEMA:\n${appContext}\n\nPROBLEMA COMPLEXO DO USUÁRIO:\n${prompt}`
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
    return handleGenAIError(error);
  }
};

// 5. Audio Transcription (Gemini 3 Flash)
// Multi-modal task using gemini-3-flash-preview for audio-to-text
export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'audio/webm',
              data: base64Audio
            }
          },
          { text: "Transcreva este áudio sobre horários de lanchas. Responda apenas com a transcrição exata." }
        ]
      }
    });
    return response.text || "Falha na transcrição.";
  } catch (error) {
    return handleGenAIError(error);
  }
};
