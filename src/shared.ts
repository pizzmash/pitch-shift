export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
export const validYoutube = (url: string) => { try { const u = new URL(url); return u.protocol === 'https:' && ['www.youtube.com', 'youtube.com', 'm.youtube.com'].includes(u.hostname); } catch { return false; } };
export type Action = 'status' | 'pitch' | 'speed' | 'rewind' | 'reset';
export interface Request { target: 'background'; action: Action; tabId: number; value?: number }
export interface State { pitch: number; speed: number; title: string }
export interface Reply { ok: boolean; error?: string; state?: State }
export interface AudioState { tabId: number | null; pitch: number }
export interface AudioRequest { target: 'offscreen'; action: 'status' | 'start' | 'pitch' | 'stop'; tabId?: number; streamId?: string; value?: number }
