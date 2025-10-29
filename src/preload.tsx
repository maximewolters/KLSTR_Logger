import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  connect: (url: string) => ipcRenderer.invoke("mqtt:connect", url),
  disconnect: () => ipcRenderer.invoke("mqtt:disconnect"),
  subscribe: (topic: string) => ipcRenderer.invoke("mqtt:subscribe", topic),
  publish: (topic: string, payload: string | Uint8Array) =>
    ipcRenderer.invoke("mqtt:publish", topic, payload),
  onDeviceStatus: (cb: (m: { id: string; status: string }) => void) => {
    ipcRenderer.on("device:status", (_e, data) => cb(data));
  },
  onMqttMessage: (cb: (msg: { topic: string; payload: Uint8Array }) => void) =>
    ipcRenderer.on("mqtt:message", (_e, m) => cb(m)),
});
