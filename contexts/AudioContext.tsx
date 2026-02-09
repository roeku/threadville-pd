import React, { createContext, useContext, ReactNode } from 'react';
import { useAudio, SFXType } from '../hooks/useAudio';

interface AudioContextType {
    settings: {
        musicVolume: number;
        ambianceVolume: number;
        sfxVolume: number;
        musicEnabled: boolean;
        ambianceEnabled: boolean;
        sfxEnabled: boolean;
    };
    updateSettings: (settings: Partial<AudioContextType['settings']>) => void;
    playSFX: (type: SFXType) => void;
    initialize: () => void;
    isInitialized: boolean;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Default no-op audio context for when provider is not available
const defaultAudioContext: AudioContextType = {
    settings: {
        musicVolume: 0.3,
        ambianceVolume: 0.15,
        sfxVolume: 0.5,
        musicEnabled: true,
        ambianceEnabled: true,
        sfxEnabled: true,
    },
    updateSettings: () => { },
    playSFX: () => { },
    initialize: () => { },
    isInitialized: false,
};

export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const audio = useAudio();

    return (
        <AudioContext.Provider value={audio}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudioContext = () => {
    const context = useContext(AudioContext);
    // Return default no-op context if provider is not available
    return context || defaultAudioContext;
};
