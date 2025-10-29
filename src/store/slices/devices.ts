// src/store/slices/devices.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type DeviceStatus = "offline"|"online"|"idle"|"running"|"error";
export interface Device { id: string; status: DeviceStatus; lastSeen: number; currentRunId?: string; }
interface DevicesState { byId: Record<string, Device>; }

const initial: DevicesState = { byId: {} };

const devices = createSlice({
  name: "devices",
  initialState: initial,
  reducers: {
    upsert(state, a:PayloadAction<Partial<Device>&{id:string}>) {
      const d = state.byId[a.payload.id] ?? { id:a.payload.id, status:"online", lastSeen: Date.now() };
      state.byId[a.payload.id] = { ...d, ...a.payload, lastSeen: Date.now() };
    },
    setOffline(state, a:PayloadAction<string>) {
      const d = state.byId[a.payload]; if (d) d.status = "offline";
    },
    setStatus(state, a:PayloadAction<{id:string; status:DeviceStatus}>) {
      const d = state.byId[a.payload.id]; if (d) d.status = a.payload.status;
    },
  },
});
export const { upsert, setOffline, setStatus } = devices.actions;
export default devices.reducer;
