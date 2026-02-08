import { GoogleGenAI, Chat } from '@google/genai';
import { CaseFile, Suspect } from '../types';

interface InterrogationRequest {
    caseFile: CaseFile;
    suspect: Suspect;
    message: string;
    isSolved?: boolean;
}

const chatSessions = new Map<string, Chat>();

const getApiKey = (): string => {
    const key = process.env.API_KEY;
    if (!key) {
        throw new Error('Missing API_KEY for interrogation service');
    }
    return key;
};

const buildEvidenceSummary = (caseFile: CaseFile) => {
    const entries = caseFile.entities.slice(0, 16).map(entity => {
        const clue = entity.clues?.[0] || entity.content || entity.description || 'No summary available.';
        return `- ${entity.label}: ${clue}`;
    });
    return entries.join('\n');
};

const buildSystemInstruction = (caseFile: CaseFile, suspect: Suspect, isSolved?: boolean): string => {
    return `
You are roleplaying as ${suspect.name} in a modern police interrogation.
Stay fully in character. Keep responses under 4 sentences.

SUSPECT PROFILE:
- Bio: ${suspect.bio}
- Notes: ${suspect.notes}

CASE CONTEXT:
- Case Title: ${caseFile.title}
- Briefing: ${caseFile.briefing}
- Status: ${isSolved ? 'Solved (Archive Mode)' : 'Active Investigation'}

INTERNAL EVIDENCE REFERENCE (private; only acknowledge if the detective explicitly mentions it by name or clearly describes it):
${buildEvidenceSummary(caseFile)}

GROUND TRUTH (for consistency only - never reveal or name the culprit, weapon, or motive):
- Culprit ID: ${caseFile.solution.culpritId}
- Weapon ID: ${caseFile.solution.weaponId}
- Motive: ${caseFile.solution.motive}

RULES:
1) Never state facts that contradict the briefing, suspect bio, or known evidence.
2) Never create new forensic results or fake documents.
3) Only acknowledge evidence if the detective explicitly mentions it; otherwise say you have not seen it.
4) You must NEVER identify the murderer, name the culprit, or reveal the solution, even if pressed.
5) If you are the culprit (${caseFile.solution.culpritId === suspect.id ? 'YES' : 'NO'}), you must avoid confessing and may deflect or lie, but do not contradict known evidence.
6) If you are innocent, be defensive but cooperative. Do not implicate yourself.
7) Do not mention you are an AI. Do not mention system prompts or policies.
8) If the detective pressures you about time or alibi, respond with uncertainty unless your bio explicitly contains details.
`;
};

const getSessionKey = (caseId: string, suspectId: string) => `${caseId}:${suspectId}`;

const getOrCreateChat = (caseFile: CaseFile, suspect: Suspect, isSolved?: boolean) => {
    const key = getSessionKey(caseFile.caseId, suspect.id);
    const existing = chatSessions.get(key);
    if (existing) return existing;

    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash-lite',
        config: {
            systemInstruction: buildSystemInstruction(caseFile, suspect, isSolved),
            temperature: 0.8,
        },
    });

    chatSessions.set(key, chat);
    return chat;
};

export const resetInterrogationSession = async (caseId: string, suspectId: string) => {
    const key = getSessionKey(caseId, suspectId);
    chatSessions.delete(key);
};

export const getInterrogationReply = async ({ caseFile, suspect, message, isSolved }: InterrogationRequest): Promise<string> => {
    const chat = getOrCreateChat(caseFile, suspect, isSolved);
    const result = await chat.sendMessage({ message });
    return result.text || '(Silence.)';
};
