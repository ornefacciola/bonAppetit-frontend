import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface MobileDataContextProps {
  isConnected: boolean | null; // null = desconocido
  isWifi: boolean | null; // null = desconocido
  allowMobileData: boolean;
  setAllowMobileData: (allow: boolean) => void;
}

const MobileDataContext = createContext<MobileDataContextProps | undefined>(undefined);

export const MobileDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isWifi, setIsWifi] = useState<boolean | null>(null);
  const [allowMobileData, setAllowMobileData] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isInternetReachable === null ? null : !!state.isInternetReachable);
      setIsWifi(state.type === 'wifi');
    });
    return () => unsubscribe();
  }, []);

  // Resetear permiso de datos móviles cada vez que vuelve el WiFi
  useEffect(() => {
    if (isWifi) {
      setAllowMobileData(false);
    }
  }, [isWifi]);

  return (
    <MobileDataContext.Provider value={{ isConnected, isWifi, allowMobileData, setAllowMobileData }}>
      {children}
    </MobileDataContext.Provider>
  );
};

export function useMobileData() {
  const context = useContext(MobileDataContext);
  if (!context) throw new Error('useMobileData debe usarse dentro de MobileDataProvider');
  return context;
} 