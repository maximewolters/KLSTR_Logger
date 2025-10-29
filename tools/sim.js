import mqtt from "mqtt";

const url = process.argv[2] || "mqtt://127.0.0.1:1883";
const deviceCount = Number(process.argv[3] || 3);

const client = mqtt.connect(url);

client.on("connect", () => {
  console.log(`[SIM] Connected to ${url}, simulating ${deviceCount} devices.`);

  for (let i = 0; i < deviceCount; i++) {
    const id = `fx-${i + 1}`;

    // Heartbeat/status every 2s
    setInterval(() => {
      client.publish(`fixture/${id}/status`, "online");
    }, 2000);

    // Fake runs every 10–14s
    setInterval(() => {
      const runId = Date.now().toString();
      client.publish(`fixture/${id}/run/start`, JSON.stringify({ runId, ts: Date.now() }));
      setTimeout(() => {
        client.publish(`fixture/${id}/run/end`, JSON.stringify({ runId, result: "pass", ts: Date.now() }));
      }, 2000 + Math.random() * 2000);
    }, 10000 + Math.random() * 4000);
  }
});
