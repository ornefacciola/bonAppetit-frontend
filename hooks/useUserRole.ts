import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export function useUserRole() {
  const [userRole, setUserRole] = useState<string | null>(null);
  useEffect(() => {
    AsyncStorage.getItem('userRole').then(setUserRole);
  }, []);
  return userRole;
} 