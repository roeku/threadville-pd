import React, { useState, useEffect, useRef } from 'react';
import { Suspect, CaseData, Message } from '../types';
import { startInterrogation, sendMessageToSuspect, connectLiveInterrogation, LiveSessionController } from '../services/geminiService';

interface InterrogationRoomProps {
  suspect: Suspect;
  caseData: CaseData;
  onBack: () => void;
}

export const InterrogationRoom: React.FC<InterrogationRoomProps> = ({ suspect, caseData, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Audio Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const liveSessionRef = useRef<LiveSessionController | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Initialize Text Chat
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await startInterrogation(suspect, caseData);
      setLoading(false);
      setInitialized(true);
    };
    init();
  }, [suspect, caseData]);

  // Voice Mode Effect
  useEffect(() => {
    if (voiceMode) {
      startVoiceSession();
    } else {
      stopVoiceSession();
    }
    return () => stopVoiceSession();
  }, [voiceMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // --- Audio Helpers ---

  const base64ToUint8Array = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const float32To16BitPCM = (float32Arr: Float32Array) => {
    const pcm16 = new Int16Array(float32Arr.length);
    for (let i = 0; i < float32Arr.length; i++) {
      let s = Math.max(-1, Math.min(1, float32Arr[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decodeAudioData = async (
    base64Data: string, 
    ctx: AudioContext
  ): Promise<AudioBuffer> => {
    const uint8Array = base64ToUint8Array(base64Data);
    const int16Array = new Int16Array(uint8Array.buffer);
    const float32Array = new Float32Array(int16Array.length);
    
    // Convert PCM16 to Float32
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768.0;
    }
    
    // Create AudioBuffer (assuming mono, 24kHz from Gemini)
    const buffer = ctx.createBuffer(1, float32Array.length, 24000);
    buffer.getChannelData(0).set(float32Array);
    return buffer;
  };

  // --- Voice Session Management ---

  const startVoiceSession = async () => {
    try {
      // Setup Audio Contexts
      const InputContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      inputAudioContextRef.current = new InputContextClass({ sampleRate: 16000 });
      outputAudioContextRef.current = new InputContextClass({ sampleRate: 24000 });

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Connect to Gemini Live
      liveSessionRef.current = await connectLiveInterrogation(
        suspect, 
        caseData,
        handleIncomingAudio,
        () => setVoiceMode(false)
      );

      // Setup Input Processing
      if (!inputAudioContextRef.current) return;
      
      const source = inputAudioContextRef.current.createMediaStreamSource(stream);
      // Use ScriptProcessor for raw PCM access (Worklets are better but more complex for this snippet)
      const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = float32To16BitPCM(inputData);
        const base64 = arrayBufferToBase64(pcm16.buffer);
        liveSessionRef.current?.sendAudio(base64);
      };

      source.connect(processor);
      processor.connect(inputAudioContextRef.current.destination); // Required for script processor to run

    } catch (err) {
      console.error("Failed to start voice session", err);
      setVoiceMode(false);
    }
  };

  const handleIncomingAudio = async (base64Audio: string) => {
    if (!outputAudioContextRef.current) return;

    try {
      setIsSpeaking(true);
      const audioCtx = outputAudioContextRef.current;
      const audioBuffer = await decodeAudioData(base64Audio, audioCtx);
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      // Schedule playback
      const currentTime = audioCtx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }
      
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      
      sourcesRef.current.add(source);
      source.onended = () => {
        sourcesRef.current.delete(source);
        if (sourcesRef.current.size === 0) {
            setIsSpeaking(false);
        }
      };

    } catch (error) {
      console.error("Error decoding audio", error);
    }
  };

  const stopVoiceSession = () => {
    if (liveSessionRef.current) {
      liveSessionRef.current.disconnect();
      liveSessionRef.current = null;
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    setIsSpeaking(false);
    nextStartTimeRef.current = 0;
  };

  // --- Handlers ---

  const handleSend = async () => {
    if (!input.trim() || loading || !initialized) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const responseText = await sendMessageToSuspect(userMsg.text);

    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-noir-900 relative overflow-hidden">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(217,119,6,0.05),transparent_70%)] pointer-events-none" />
        <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-noir-accent to-transparent opacity-20" />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-noir-900/90 z-10 backdrop-blur-sm">
        <button 
          onClick={onBack}
          className="text-noir-paper/60 hover:text-noir-accent transition-colors font-mono text-sm flex items-center gap-2"
        >
          ← EXIT ROOM
        </button>
        <div className="text-center">
            <h2 className="font-display text-2xl text-noir-paper tracking-widest uppercase">Interrogation</h2>
            <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${voiceMode ? 'bg-green-500 animate-pulse' : 'bg-red-600'} `}></div>
                <span className="font-mono text-xs text-white/50 uppercase">{voiceMode ? 'Live Voice Connection' : 'Recording In Progress'}</span>
            </div>
        </div>
        <div className="w-24 flex justify-end">
             <button 
               onClick={() => setVoiceMode(!voiceMode)}
               className={`
                 font-mono text-xs px-3 py-1 border rounded transition-all
                 ${voiceMode 
                   ? 'bg-noir-accent text-noir-900 border-noir-accent font-bold animate-pulse' 
                   : 'border-white/20 text-white/50 hover:text-white hover:border-white'}
               `}
             >
               {voiceMode ? 'VOICE ON' : 'ENABLE VOICE'}
             </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Suspect Visage */}
        <div className="hidden md:flex w-1/3 flex-col items-center justify-center p-8 border-r border-white/5 bg-noir-800/50">
           <div className={`relative transition-all duration-500 ${isSpeaking ? 'scale-105' : ''}`}>
             <img 
               src={suspect.photoUrl} 
               alt={suspect.name} 
               className={`
                 w-48 h-60 object-cover grayscale contrast-125 border-4 shadow-2xl transition-colors duration-300
                 ${isSpeaking ? 'border-noir-accent' : 'border-white/10'}
               `}
             />
             <div className="absolute inset-0 bg-gradient-to-t from-noir-900 to-transparent opacity-60"></div>
             {voiceMode && (
               <div className="absolute -bottom-10 left-0 w-full h-1 bg-noir-900/50 flex items-end justify-center gap-1 h-8">
                 {/* Simple Audio Visualizer Bars */}
                 {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1 bg-noir-accent transition-all duration-100 ${isSpeaking ? 'animate-[bounce_0.5s_infinite]' : 'h-1'}`}
                      style={{ height: isSpeaking ? `${Math.random() * 20 + 5}px` : '4px', animationDelay: `${i * 0.1}s` }}
                    />
                 ))}
               </div>
             )}
           </div>
           <h3 className="mt-6 font-display text-3xl text-white tracking-wider">{suspect.name}</h3>
           <p className="mt-2 font-mono text-sm text-noir-accent">{suspect.notes}</p>
           
           <div className="mt-8 w-full">
               <h4 className="font-mono text-xs text-white/30 uppercase border-b border-white/10 pb-1 mb-2">Known Alibi</h4>
               <p className="font-mono text-xs text-white/70 italic leading-relaxed">"{suspect.bio.split('Alibi:')[1] || suspect.bio}"</p>
           </div>
        </div>

        {/* Right: Interaction Area */}
        <div className="flex-1 flex flex-col relative">
          
          {voiceMode ? (
            <div className="flex-1 flex flex-col items-center justify-center relative">
               <div className="absolute inset-0 bg-black/50 z-0"></div>
               <div className="z-10 text-center space-y-8 p-8">
                  <div className="w-32 h-32 rounded-full border-4 border-noir-accent/30 flex items-center justify-center relative">
                     <div className={`absolute inset-0 rounded-full border-4 border-noir-accent opacity-50 ${isSpeaking ? 'animate-ping' : ''}`}></div>
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-noir-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                     </svg>
                  </div>
                  
                  <div>
                    <h3 className="font-display text-2xl text-white">Voice Connection Active</h3>
                    <p className="font-mono text-sm text-white/50 mt-2">Speak clearly. The suspect is listening.</p>
                  </div>

                  {isSpeaking && (
                     <div className="font-mono text-noir-accent animate-pulse">
                        {suspect.name.split(' ')[0]} is speaking...
                     </div>
                  )}
               </div>
            </div>
          ) : (
            <>
              {/* Text Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-white/20 font-mono text-sm">
                        <p>Begin interrogation of Subject {suspect.id}...</p>
                    </div>
                )}

                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`
                        max-w-[80%] p-4 text-sm font-mono leading-relaxed shadow-lg
                        ${msg.role === 'user' 
                          ? 'bg-noir-700 text-noir-paper border-l-2 border-noir-accent rounded-r-lg rounded-tl-lg' 
                          : 'bg-noir-paper text-noir-900 border-l-4 border-red-900 rounded-l-lg rounded-tr-lg paper-texture'
                        }
                      `}
                    >
                      <div className="mb-1 text-[10px] uppercase opacity-50 font-bold tracking-wider">
                        {msg.role === 'user' ? 'DETECTIVE' : suspect.name.split(' ')[1].toUpperCase()}
                      </div>
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-start">
                      <div className="bg-noir-paper/10 text-noir-accent p-3 rounded text-xs font-mono animate-pulse">
                          Subject is thinking...
                      </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-noir-800 border-t border-white/10">
                <div className="relative flex items-end gap-2 max-w-4xl mx-auto">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask a question..."
                    disabled={loading || !initialized}
                    className="w-full bg-noir-900 text-noir-paper placeholder-white/20 border border-white/10 p-4 font-mono text-sm focus:outline-none focus:border-noir-accent focus:ring-1 focus:ring-noir-accent resize-none h-14 rounded-sm transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim() || !initialized}
                    className="h-14 px-6 bg-noir-accent text-noir-900 font-bold font-display uppercase tracking-wider hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-sm"
                  >
                    Ask
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};