import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  connect: (url: string) => ipcRenderer.invoke("mqtt:connect", url),
  disconnect: () => ipcRenderer.invoke("mqtt:disconnect"),
  subscribe: (topic: string) => ipcRenderer.invoke("mqtt:subscribe", topic),
  publish: (t: string, p: string | Buffer) => ipcRenderer.invoke("mqtt:publish", t, p),

  onMqttMessage: (cb: (m: { topic: string; payload: Uint8Array }) => void) =>
    ipcRenderer.on("mqtt:message", (_e, m) => cb(m)),

  // <- this must exist
  onDeviceStatus: (cb: (m: { id: string; status: string }) => void) =>
    ipcRenderer.on("device:status", (_e, m) => cb(m)),
});

