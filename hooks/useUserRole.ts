import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export function useUserRole() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let role = await AsyncStorage.getItem('userRole');
      if (!role) {
        role = 'guest';
        await AsyncStorage.setItem('userRole', 'guest');
      }
      setUserRole(role);
    })();
  }, []);

  return userRole;
} 