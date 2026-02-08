import { GoogleGenAI, Chat, LiveServerMessage, Modality } from "@google/genai";
import { CaseData, Suspect } from '../types';

let chatSession: Chat | null = null;

const getSystemInstruction = (suspect: Suspect, caseData: CaseData): string => {
  return `
    You are roleplaying as ${suspect.name} in a murder mystery game.
    
    PERSONAL PROFILE:
    - Bio: ${suspect.bio}
    - Notes/Personality: ${suspect.notes}
    - Alibi: ${suspect.bio.split('Alibi:')[1] || "Not clearly stated, improvisation required."}
    
    CASE CONTEXT:
    - Victim: Arthur 'Artie' Penhaligon (HOA President).
    - Scenario: ${caseData.briefing}
    
    RULES OF ENGAGEMENT:
    1. Stay completely in character. Use tone and vocabulary fitting your bio.
    2. You are being interrogated by a detective (the user).
    3. DO NOT confess to the murder immediately. Even if you are the killer, lie, deflect, or get angry.
    4. If you are innocent, be defensive, confused, or helpful depending on your personality.
    5. If the user presents evidence (concepts like "the gnome", "the video", "the mulch"), react to it.
    6. Keep responses conversational and under 4 sentences. This is a rapid-fire interrogation.
    7. Do not mention you are an AI. You are the suspect.
    
    CRITICAL:
    You do NOT know the full solution provided in the game data unless you are the killer.
    If you are the killer (${caseData.solution.culpritId === suspect.id ? 'YES, YOU ARE THE KILLER' : 'NO, YOU ARE INNOCENT'}), act accordingly.
    If Killer: You are lying about your alibi. You are nervous if pressed about specific times (5:00-5:30 AM).
  `;
};

export const startInterrogation = async (suspect: Suspect, caseData: CaseData): Promise<void> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  chatSession = ai.chats.create({
    model: 'gemini-2.5-flash-lite',
    config: {
      systemInstruction: getSystemInstruction(suspect, caseData),
      temperature: 0.9, 
    },
  });
};

export const sendMessageToSuspect = async (message: string): Promise<string> => {
  if (!chatSession) {
    throw new Error("Interrogation not started.");
  }

  try {
    const result = await chatSession.sendMessage({ message });
    return result.text || "...";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "( The suspect stares blankly, refusing to answer. )";
  }
};

// --- Live API Integration ---

export interface LiveSessionController {
  sendAudio: (base64Audio: string) => void;
  disconnect: () => void;
}

export const connectLiveInterrogation = async (
  suspect: Suspect,
  caseData: CaseData,
  onAudioData: (base64Audio: string) => void,
  onClose: () => void
): Promise<LiveSessionController> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Create a session promise to ensure we only send data after connection
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    config: {
      systemInstruction: getSystemInstruction(suspect, caseData),
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
    callbacks: {
      onopen: () => {
        console.log("Live session connected");
      },
      onmessage: (message: LiveServerMessage) => {
        const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (audioData) {
          onAudioData(audioData);
        }
      },
      onclose: () => {
        console.log("Live session closed");
        onClose();
      },
      onerror: (error) => {
        console.error("Live session error:", error);
        onClose();
      }
    }
  });

  return {
    sendAudio: (base64Audio: string) => {
      sessionPromise.then(session => {
        session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Audio
          }
        });
      });
    },
    disconnect: () => {
      sessionPromise.then(session => session.close());
    }
  };
};