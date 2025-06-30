import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface FavoriteContextType {
  favoriteIds: Set<string>;
  refreshFavorites: () => Promise<void>;
  toggleFavorite: (recipeId: string) => Promise<void>;
  isFavorite: (recipeId: string) => boolean;
  loading: boolean;
}

const FavoriteContext = createContext<FavoriteContextType | undefined>(undefined);

export const FavoriteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refreshFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;
      const response = await fetch('https://bon-appetit-production.up.railway.app/api/favourite-recipies', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        const ids = (data.recipes || []).map((r: any) => r._id);
        setFavoriteIds(new Set(ids));
      }
    } catch (e) {
      // handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const toggleFavorite = useCallback(async (recipeId: string) => {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return;
    const isFav = favoriteIds.has(recipeId);
    const url = `https://bon-appetit-production.up.railway.app/api/favourite-recipies/${recipeId}/`;
    const method = isFav ? 'DELETE' : 'POST';
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        // Actualizar localmente
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          if (isFav) {
            newSet.delete(recipeId);
          } else {
            newSet.add(recipeId);
          }
          return newSet;
        });
      } else {
        alert('Error al actualizar favorito');
      }
    } catch (e) {
      alert('Error de red al actualizar favorito');
    }
  }, [favoriteIds]);

  const isFavorite = useCallback((recipeId: string) => favoriteIds.has(recipeId), [favoriteIds]);

  return (
    <FavoriteContext.Provider value={{ favoriteIds, refreshFavorites, toggleFavorite, isFavorite, loading }}>
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavorite = () => {
  const ctx = useContext(FavoriteContext);
  if (!ctx) throw new Error('useFavorite debe usarse dentro de <FavoriteProvider>');
  return ctx;
}; 