import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface ConnectionContextProps {
  isConnected: boolean;
  type: NetInfoState['type'];
  subscribe: (callback: (state: { isConnected: boolean; type: NetInfoState['type'] }) => void) => () => void;
}

const ConnectionContext = createContext<ConnectionContextProps | undefined>(undefined);

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [type, setType] = useState<NetInfoState['type']>('unknown');
  const observers = React.useRef(new Set<(state: { isConnected: boolean; type: NetInfoState['type'] }) => void>());

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(!!state.isConnected);
      setType(state.type);
      observers.current.forEach(cb => cb({ isConnected: !!state.isConnected, type: state.type }));
    });
    return () => unsubscribe();
  }, []);

  const subscribe = (callback: (state: { isConnected: boolean; type: NetInfoState['type'] }) => void) => {
    observers.current.add(callback);
    return () => observers.current.delete(callback);
  };

  return (
    <ConnectionContext.Provider value={{ isConnected, type, subscribe }}>
      {children}
    </ConnectionContext.Provider>
  );
};

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) throw new Error('useConnection debe usarse dentro de ConnectionProvider');
  return context;
} 