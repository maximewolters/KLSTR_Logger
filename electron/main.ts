import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import mqtt, { MqttClient } from "mqtt";
import { parseFixtureTopic } from "./mqtt/parse"; 

let win: BrowserWindow | null = null;
let client: MqttClient | null = null;
function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  win.on("closed", () => {
    win = null;
  });
}

/* -------------------------------
   MQTT IPC HANDLERS
--------------------------------*/
ipcMain.handle("mqtt:connect", async (_e, url: string) => {
  return new Promise((resolve, reject) => {
    try {
      client = mqtt.connect(url);

      client.on("connect", () => {
        console.log("[MQTT] Connected:", url);
        resolve(true);
      });

      client.on("error", (err) => {
        console.error("[MQTT] Error:", err);
        reject(err);
      });

      client.on("message", (topic: string, payload: Buffer) => {
        // Forward all messages to renderer
        win?.webContents.send("mqtt:message", {
          topic,
          payload: new Uint8Array(payload),
        });

        // --- Device management helper ---
        // inside client.on("message", (topic, payload) => { ... })
        const parsed = parseFixtureTopic(topic);
        if (parsed?.group === "status") {
        console.log("[main] device:status", parsed.id, payload.toString());
        win?.webContents.send("device:status", {
            id: parsed.id,
            status: payload.toString(),
        });
        }

        // Future: handle run/start, run/end, chunk, etc.
      });
    } catch (err) {
      reject(err);
    }
  });
});

ipcMain.handle("mqtt:disconnect", async () => {
  try {
    if (client) {
      client.end(true);
      client = null;
    }
  } catch (err) {
    console.error("[MQTT] Disconnect error:", err);
  }
});

ipcMain.handle("mqtt:subscribe", async (_e, topic: string) => {
  try {
    client?.subscribe(topic);
    console.log("[MQTT] Subscribed:", topic);
  } catch (err) {
    console.error("[MQTT] Subscribe error:", err);
  }
});

ipcMain.handle("mqtt:publish", async (_e, topic: string, payload: string | Buffer) => {
  try {
    client?.publish(topic, payload);
    console.log("[MQTT] Publish:", topic, payload.toString());
  } catch (err) {
    console.error("[MQTT] Publish error:", err);
  }
});

/* -------------------------------
   APP LIFECYCLE
--------------------------------*/
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
