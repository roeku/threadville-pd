import React from 'react';
import { CaseFile } from '../types';
import { ForensicDesktop } from './os/ForensicDesktop';

interface ComputerScreenProps {
    currentCase: CaseFile;
    onPrint: (content: string, title?: string, metadata?: any) => void;
    onLogOut: () => void;
    startApp?: string;
}

const ComputerScreen: React.FC<ComputerScreenProps> = ({ currentCase, onPrint, onLogOut, startApp }) => {
    return (
        <ForensicDesktop
            currentCase={currentCase}
            onPrint={onPrint}
            onLogOut={onLogOut}
            startApp={startApp}
        />
    );
};

export default ComputerScreen;
