import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "./store";
import {
  intentConnect,
  intentDisconnect,
  setBrokerUrl,
} from "./store/slices/app";

type DeviceRow = { id: string; status: string; lastSeen: number };

export default function App() {
  const dispatch = useDispatch();
  const { brokerUrl, status, error } = useSelector((s: RootState) => s.app);

  const [url, setUrl] = useState(brokerUrl);
  const [topic, setTopic] = useState("test/#");
  const [log, setLog] = useState<Array<{ t: string; msg: string }>>([]);

  // NEW: devices map keyed by id
  const [devices, setDevices] = useState<Record<string, DeviceRow>>({});

  const inElectron = typeof (window as any).api?.connect === "function";

  // Existing: MQTT message log
  useEffect(() => {
    if (!inElectron) return;
    const handler = (m: { topic: string; payload: Uint8Array }) => {
      const text = tryDecode(m.payload);
      setLog((prev) => [...prev.slice(-499), { t: m.topic, msg: text }]); // keep last 500
    };
    window.api.onMqttMessage(handler);
  }, [inElectron]);

  // NEW: listen for high-level device status events from main.ts
  useEffect(() => {
    if (!inElectron) return;
    const onStatus = (m: { id: string; status: string }) => {
      console.log("[renderer] device:status", m);
      setDevices((prev) => ({
        ...prev,
        [m.id]: { id: m.id, status: m.status, lastSeen: Date.now() },
      }));
    };
    // Use (window as any) to avoid TS errors if preload.d.ts isn't updated yet
    (window as any).api?.onDeviceStatus?.(onStatus);
  }, [inElectron]);

  // NEW: mark devices offline if no heartbeat for 10s
  useEffect(() => {
    const t = setInterval(() => {
      setDevices((prev) => {
        const now = Date.now();
        let changed = false;
        const next: Record<string, DeviceRow> = { ...prev };
        for (const id of Object.keys(prev)) {
          if (
            now - prev[id].lastSeen > 10_000 &&
            prev[id].status !== "offline"
          ) {
            next[id] = { ...prev[id], status: "offline" };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const connect = () => {
    dispatch(setBrokerUrl(url));
    dispatch(intentConnect(url));
  };

  const subscribe = async () => {
    if (!inElectron) return;
    await window.api.subscribe(topic);
  };

  const publish = async () => {
    if (!inElectron) return;
    await (window as any).api.publish(
      topic.replace("#", "ping"),
      `hello @ ${new Date().toISOString()}`
    );
  };

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "system-ui, sans-serif",
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      <h1>KLSTR Logger</h1>

      {!inElectron && (
        <div
          style={{
            background: "#fff3cd",
            border: "1px solid #ffeeba",
            padding: 12,
            marginBottom: 12,
          }}
        >
          You’re viewing the dev server in a browser. Use the{" "}
          <b>Electron window</b> launched by
          <code> npm run dev</code> to enable the bridge.
        </div>
      )}

      <label>MQTT Broker URL</label>
      <input
        style={{ width: "100%", padding: 10, fontSize: 14, marginTop: 6 }}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="mqtt://127.0.0.1:1883"
      />

      <div
        style={{
          marginTop: 12,
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <button onClick={connect} disabled={status === "connecting"}>
          Connect
        </button>
        <button
          onClick={() => dispatch(intentDisconnect())}
          disabled={status !== "connected"}
        >
          Disconnect
        </button>
        <span>
          {" "}
          Status: <b>{status}</b>
          {error ? ` — ${error}` : ""}
        </span>
      </div>

      <hr style={{ margin: "20px 0" }} />

      {/* NEW: Devices table */}
      {/* Devices table */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Devices</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  textAlign: "left",
                  padding: 8,
                  borderBottom: "1px solid #ddd",
                }}
              >
                ID
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: 8,
                  borderBottom: "1px solid #ddd",
                }}
              >
                Status
              </th>
              <th
                style={{
                  textAlign: "left",
                  padding: 8,
                  borderBottom: "1px solid #ddd",
                }}
              >
                Last seen
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.values(devices)
              .sort((a, b) => a.id.localeCompare(b.id))
              .map((d) => (
                <tr key={d.id}>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    {d.id}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    {d.status}
                  </td>
                  <td style={{ padding: 8, borderBottom: "1px solid #eee" }}>
                    {Math.round((Date.now() - d.lastSeen) / 1000)}s ago
                  </td>
                </tr>
              ))}
            {Object.keys(devices).length === 0 && (
              <tr>
                <td colSpan={3} style={{ padding: 8, color: "#777" }}>
                  No devices yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          gap: 12,
          alignItems: "center",
        }}
      >
        <input
          style={{ width: "100%", padding: 10, fontSize: 14 }}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="test/# or fixture/+/status"
        />
        <button onClick={subscribe} disabled={status !== "connected"}>
          Subscribe
        </button>
        <button onClick={publish} disabled={status !== "connected"}>
          Publish (test)
        </button>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Messages</div>
        <div
          style={{
            border: "1px solid #ddd",
            borderRadius: 6,
            padding: 8,
            height: 320,
            overflow: "auto",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 13,
          }}
        >
          {log.length === 0 ? (
            <div style={{ opacity: 0.6 }}>No messages yet.</div>
          ) : null}
          {log.map((l, i) => (
            <div key={i}>
              <span style={{ color: "#555" }}>{l.t}</span> — {l.msg}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function tryDecode(u8: Uint8Array) {
  try {
    return new TextDecoder().decode(u8);
  } catch {
    return `[${u8.byteLength} bytes]`;
  }
}
