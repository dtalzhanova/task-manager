import { createContext, useContext, useSyncExternalStore, useRef } from 'react';
import type { ReactNode } from 'react';
import { createStore } from './store';
import type { Store } from './store';
import type { AppState } from './types';

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<Store>(createStore());
  return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be inside StoreProvider');
  return store;
}

export function useAppState(): AppState {
  const store = useStore();
  return useSyncExternalStore(store.subscribe, store.getState);
}
