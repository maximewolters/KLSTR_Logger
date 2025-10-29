// Type definitions for the API exposed in electron/preload.ts
export {};

interface MqttMessage {
  topic: string;
  payload: Uint8Array;
}

interface DeviceStatus {
  id: string;
  status: string;
}

interface Api {
  connect: (url: string) => Promise<any>;
  disconnect: () => Promise<any>;
  subscribe: (topic: string) => Promise<any>;
  publish: (topic: string, payload: string | Buffer) => Promise<any>;
  onMqttMessage: (cb: (m: MqttMessage) => void) => void;
  onDeviceStatus: (cb: (m: DeviceStatus) => void) => void;
}

declare global {
  interface Window {
    api: Api;
  }
}


