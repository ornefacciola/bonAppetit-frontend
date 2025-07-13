import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface BaseUser {
  role: string;
}

interface AuthenticatedUser extends BaseUser {
  _id: string;
  name: string;
  email: string;
  alias: string;
}

type User = BaseUser | AuthenticatedUser;

type AuthContextType = {
  token: string | null;
  user: User | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: async () => {},
  logout: async () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserFromToken = async (storedToken: string) => {
    try {
      const response = await fetch('https://bon-appetit-production.up.railway.app/api/session', {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.user?.role) {
        setUser(data.user);
        setToken(storedToken);
        await AsyncStorage.setItem('authToken', storedToken);
        await AsyncStorage.setItem('userRole', data.user.role);

        if ('_id' in data.user) {
          const { _id, alias, name, email } = data.user;
          const userInfo = JSON.stringify({ _id, alias, name, email });
          await AsyncStorage.setItem('userInfo', userInfo);
          await AsyncStorage.setItem('currentUserId', _id);
        } else {
          await AsyncStorage.removeItem('userInfo');
          await AsyncStorage.removeItem('currentUserId');
        }
      } else {
        await logout();
      }
    } catch (error) {
      await logout();
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const storedToken = await AsyncStorage.getItem('authToken');
      if (storedToken) {
        await fetchUserFromToken(storedToken);
      }
      setIsLoading(false);
    };
    initialize();
  }, []);

  const login = async (newToken: string) => {
    await fetchUserFromToken(newToken);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('userInfo');
    await AsyncStorage.removeItem('currentUserId');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
