
export type MessageType = 'text' | 'audio' | 'video' | 'image' | 'system';

export interface Message {
  id: string;
  sender: 'me' | 'other';
  content: string; // For text messages, or base64 data for audio/image
  timestamp: number;
  type: MessageType;
  metadata?: {
    duration?: number;
    thumbnail?: string;
    fileName?: string;
  };
}

export interface UserProfile {
  name: string;
  status: 'online' | 'offline' | 'typing';
  avatar: string;
}

export enum AppMode {
  CHAT = 'chat',
  VIDEO_CALL = 'video_call',
  SETTINGS = 'settings'
}
