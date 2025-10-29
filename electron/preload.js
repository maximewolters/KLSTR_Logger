"use strict";

// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("api", {
  connect: (url) => import_electron.ipcRenderer.invoke("mqtt:connect", url),
  disconnect: () => import_electron.ipcRenderer.invoke("mqtt:disconnect"),
  subscribe: (topic) => import_electron.ipcRenderer.invoke("mqtt:subscribe", topic),
  publish: (t, p) => import_electron.ipcRenderer.invoke("mqtt:publish", t, p),
  onMqttMessage: (cb) => import_electron.ipcRenderer.on("mqtt:message", (_e, m) => cb(m)),
  // <- this must exist
  onDeviceStatus: (cb) => import_electron.ipcRenderer.on("device:status", (_e, m) => cb(m))
});
