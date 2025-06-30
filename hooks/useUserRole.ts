import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export function useUserRole() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const role = await AsyncStorage.getItem('userRole');
        console.log('useUserRole: loaded role:', role);
        setUserRole(role);
      } catch (error) {
        console.error('useUserRole: error loading role:', error);
        setUserRole(null);
      }
    };

    loadUserRole();
  }, []);

  return userRole;
} 