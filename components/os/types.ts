import React, { ReactNode } from 'react';
import { CaseFile } from '../../types';

export type AppId = 'dna' | 'fingerprint' | 'spectrograph' | 'evidence' | 'settings' | 'decryptor' | 'image_viewer' | 'document_viewer' | 'evidence_catalog' | 'interrogation';

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  w: number; // Percentage 0-100
  h: number; // Percentage 0-100
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  data?: any; // Passed data (e.g. specific evidence to analyze)
}

export interface AppConfig {
  id: AppId;
  name: string;
  icon: ReactNode;
  defaultW: number;
  defaultH: number;
  component: React.ComponentType<any>;
}

export interface DragPosition {
  x: number;
  y: number;
}
