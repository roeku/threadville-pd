import React, { ReactNode } from 'react';

export type AppId = 'dna' | 'fingerprint' | 'spectrograph' | 'evidence' | 'settings' | 'decryptor';

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
}

export interface AppConfig {
  id: AppId;
  name: string;
  icon: ReactNode;
  defaultW: number;
  defaultH: number;
  component: React.ComponentType;
}

export interface DragPosition {
  x: number;
  y: number;
}