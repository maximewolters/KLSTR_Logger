"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var import_path = __toESM(require("path"));
var import_mqtt = __toESM(require("mqtt"));

// electron/mqtt/parse.ts
var parseFixtureTopic = (t) => {
  const m = /^fixture\/([^/]+)\/([^/]+)(?:\/([^/]+))?$/.exec(t);
  return m ? { id: m[1], group: m[2], leaf: m[3] } : null;
};

// electron/main.ts
var win = null;
var client = null;
console.log("[main] preload path:", import_path.default.join(__dirname, "preload.js"));
function createWindow() {
  win = new import_electron.BrowserWindow({
    width: 1e3,
    height: 700,
    webPreferences: {
      preload: import_path.default.join(__dirname, "preload.js")
    }
  });
  const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(import_path.default.join(__dirname, "../dist/index.html"));
  }
  win.on("closed", () => {
    win = null;
  });
}
import_electron.ipcMain.handle("mqtt:connect", async (_e, url) => {
  return new Promise((resolve, reject) => {
    try {
      client = import_mqtt.default.connect(url);
      client.on("connect", () => {
        console.log("[MQTT] Connected:", url);
        resolve(true);
      });
      client.on("error", (err) => {
        console.error("[MQTT] Error:", err);
        reject(err);
      });
      client.on("message", (topic, payload) => {
        win?.webContents.send("mqtt:message", {
          topic,
          payload: new Uint8Array(payload)
        });
        const parsed = parseFixtureTopic(topic);
        if (parsed?.group === "status") {
          console.log("[main] device:status", parsed.id, payload.toString());
          win?.webContents.send("device:status", {
            id: parsed.id,
            status: payload.toString()
          });
        }
      });
    } catch (err) {
      reject(err);
    }
  });
});
import_electron.ipcMain.handle("mqtt:disconnect", async () => {
  try {
    if (client) {
      client.end(true);
      client = null;
    }
  } catch (err) {
    console.error("[MQTT] Disconnect error:", err);
  }
});
import_electron.ipcMain.handle("mqtt:subscribe", async (_e, topic) => {
  try {
    client?.subscribe(topic);
    console.log("[MQTT] Subscribed:", topic);
  } catch (err) {
    console.error("[MQTT] Subscribe error:", err);
  }
});
import_electron.ipcMain.handle("mqtt:publish", async (_e, topic, payload) => {
  try {
    client?.publish(topic, payload);
    console.log("[MQTT] Publish:", topic, payload.toString());
  } catch (err) {
    console.error("[MQTT] Publish error:", err);
  }
});
import_electron.app.whenReady().then(createWindow);
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") import_electron.app.quit();
});
import_electron.app.on("activate", () => {
  if (import_electron.BrowserWindow.getAllWindows().length === 0) createWindow();
});
