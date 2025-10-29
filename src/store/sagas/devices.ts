// src/store/sagas/devices.ts
import { eventChannel } from "redux-saga";
import { call, put, take, delay, fork, select } from "redux-saga/effects";
import { upsert, setOffline, setStatus } from "../slices/devices";

function createMqttChannel() {
  return eventChannel((emit) => {
    if (!window.api?.onMqttMessage) return () => {};
    window.api.onMqttMessage((m) => emit(m));
    return () => {};
  });
}

function* offlineMonitor(): Generator<any, void, any> {
  while (true) {
    yield delay(3000);
    // `select` yields the selected state value, not a SelectEffect object.
    // Type the result as a record with an optional lastSeen number (or use `any`).
    const byId: Record<string, { lastSeen?: number }> = yield select((s: any) => s.devices.byId);
    const now = Date.now();
    for (const id of Object.keys(byId)) {
      const lastSeen = byId[id]?.lastSeen ?? 0;
      if (now - lastSeen > 10_000) yield put(setOffline(id));
    }
  }
}

export function* watchMqtt(): Generator<any, void, any> {
  const chan = yield call(createMqttChannel);
  yield fork(offlineMonitor);
  while (true) {
    const { topic, payload } = yield take(chan);
    if (!topic.startsWith("fixture/")) continue;

    // lightweight parse on renderer (duplicate of main’s logic is OK here)
    const m = /^fixture\/([^/]+)\/([^/]+)(?:\/([^/]+))?$/.exec(topic);
    if (!m) continue;
    const [, id, group, leaf] = m;

    // heartbeat/status inference
    if (group === "status") {
      const txt = new TextDecoder().decode(payload);
      const status = (txt as any) as "online"|"idle"|"running"|"error"|"offline";
      yield put(upsert({ id, status }));
    } else if (group === "run" && leaf === "start") {
      yield put(upsert({ id, status: "running" }));
    } else if (group === "run" && leaf === "end") {
      yield put(upsert({ id, status: "idle" }));
    } else {
      // any message counts as heartbeat
      yield put(upsert({ id, status: "online" }));
    }
  }
}
