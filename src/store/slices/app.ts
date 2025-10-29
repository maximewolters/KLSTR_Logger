import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type Status = 'disconnected' | 'connecting' | 'connected' | 'error';
type AppState = {
  brokerUrl: string;
  status: Status;
  error?: string;
};

const initial: AppState = {
  brokerUrl: 'mqtt://127.0.0.1:1883',
  status: 'disconnected',
};

const app = createSlice({
  name: 'app',
  initialState: initial,
  reducers: {
    setBrokerUrl: (s, a: PayloadAction<string>) => { s.brokerUrl = a.payload; },
    setStatus: (s, a: PayloadAction<Status>) => { s.status = a.payload; if (a.payload !== 'error') s.error = undefined; },
    setError: (s, a: PayloadAction<string>) => { s.status = 'error'; s.error = a.payload; },
    intentConnect: (_s, _a: PayloadAction<string>) => {},
    intentDisconnect: () => {},
  },
});

export const { setBrokerUrl, setStatus, setError, intentConnect, intentDisconnect } = app.actions;
export default app.reducer;
