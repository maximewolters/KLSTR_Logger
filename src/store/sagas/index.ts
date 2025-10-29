import { all, call, put, takeLatest } from 'redux-saga/effects';
import { intentConnect, intentDisconnect, setError, setStatus } from '../slices/app';

function connectApi(url: string) { return window.api.connect(url) as Promise<boolean>; }
function disconnectApi() { return window.api.disconnect() as Promise<void>; }

function* connectSaga(action: ReturnType<typeof intentConnect>) {
  try {
    yield put(setStatus('connecting'));
    const ok: boolean = yield call(connectApi, action.payload);
    yield put(setStatus(ok ? 'connected' : 'error'));
    if (!ok) yield put(setError('Failed to connect'));
  } catch (e: any) {
    yield put(setError(e?.message || 'Connect error'));
  }
}

function* disconnectSaga() {
  try {
    yield call(disconnectApi);
    yield put(setStatus('disconnected'));
  } catch (e: any) {
    yield put(setError(e?.message || 'Disconnect error'));
  }
}

export default function* rootSaga() {
  yield all([
    takeLatest(intentConnect.type, connectSaga),
    takeLatest(intentDisconnect.type, disconnectSaga),
  ]);
}
