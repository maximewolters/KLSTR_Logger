import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';
import appReducer from './slices/app';
import rootSaga from './sagas';
import devicesReducer from "./slices/devices";

const saga = createSagaMiddleware();

export const store = configureStore({
  reducer: { app: appReducer, devices: devicesReducer },
  middleware: (gDM) => gDM({ serializableCheck: false }).concat(saga),
});

saga.run(rootSaga);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
