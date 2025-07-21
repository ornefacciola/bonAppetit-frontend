import RecipeCard from '@/components/receta/RecipeCard';
import { AppLogo } from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Recipe {
  _id: string;
  title: string;
  category: string;
  user: string;
  image_url: string;
  averageRating: number;
  customized?: boolean;
  ingredients?: any[];
  savedPortions?: number;
  userId?: string; // Para identificar a qué usuario pertenece el favorito personalizado
}

export default function FavoritosScreen() {
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { token } = useAuth();
  const userRole = useUserRole();

  useEffect(() => {
    fetchAllFavorites();
  }, [token, userRole]);

  const fetchAllFavorites = async () => {
    setLoading(true);
    try {
      const allFavorites: Recipe[] = [];

      // Solo cargar favoritos si el usuario está logueado (no es guest)
      if (token && userRole !== 'guest') {
        // 1. Obtener favoritos del backend (API)
        try {
          const response = await fetch('https://bon-appetit-production.up.railway.app/api/favourite-recipies', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();
          if (response.ok && data.status === 'success') {
            const apiFavorites = data.recipes || [];
            allFavorites.push(...apiFavorites);
          }
        } catch (error) {
          console.error('Error fetching API favorites:', error);
        }

        // 2. Obtener favoritos personalizados (AsyncStorage) - específicos del usuario
        try {
          const currentUserId = await AsyncStorage.getItem('currentUserId');
          const data = await AsyncStorage.getItem('favoriteRecipes');
          if (data && currentUserId) {
            const customFavorites = JSON.parse(data);
            // Solo incluir favoritos personalizados del usuario actual
            const userCustomFavorites = customFavorites.filter((fav: any) => 
              fav.userId === currentUserId || !fav.userId // Compatibilidad con favoritos antiguos
            );
            allFavorites.push(...userCustomFavorites);
          }
        } catch (error) {
          console.error('Error fetching custom favorites:', error);
        }

        // 3. Eliminar duplicados (si una receta está en ambos, priorizar la personalizada)
        const uniqueFavorites = allFavorites.reduce((acc: Recipe[], current) => {
          const existingIndex = acc.findIndex(item => item._id === current._id);
          if (existingIndex === -1) {
            acc.push(current);
          } else {
            // Si ya existe, mantener la versión personalizada si existe
            if (current.customized) {
              acc[existingIndex] = current;
            }
          }
          return acc;
        }, []);

        setFavorites(uniqueFavorites);
      } else {
        // Usuario no logueado o es guest
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (id: string, customized: boolean) => {
    if (!token || userRole === 'guest') return;
    
    try {
      if (customized) {
        // Eliminar de AsyncStorage - solo del usuario actual
        const currentUserId = await AsyncStorage.getItem('currentUserId');
        const data = await AsyncStorage.getItem('favoriteRecipes');
        let favs = data ? JSON.parse(data) : [];
        favs = favs.filter((r: any) => !(r._id === id && r.customized && (r.userId === currentUserId || !r.userId)));
        await AsyncStorage.setItem('favoriteRecipes', JSON.stringify(favs));
      } else {
        // Eliminar del backend
        const response = await fetch(`https://bon-appetit-production.up.railway.app/api/favourite-recipies/${id}/`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to remove from backend');
        }
      }

      // Actualizar la lista local
      setFavorites(prev => prev.filter(recipe => !(recipe._id === id && !!recipe.customized === customized)));
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Error al eliminar favorito');
    }
  };

  // Si es guest, mostrar pantalla de login
  if (userRole === 'guest') {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#025E45" />
        </TouchableOpacity>
        <View style={styles.guestContainer}>
          <AppLogo width={100} height={29} style={{ marginBottom: 20 }} />
          <Ionicons name="heart-outline" size={38} color="#b0b0b0" style={{ marginBottom: 12 }} />
          <Text style={styles.guestTitle}>Inicia sesión para ver tus favoritos</Text>
          <Text style={styles.guestSubtitle}>
            Guarda tus recetas favoritas y personalízalas a tu gusto
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#025E45" />
          <Text style={styles.loadingText}>Cargando favoritos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.push('/(tabs)/home')}>
        <AppLogo width={150} height={69} style={{ marginBottom: 8 }} />
      </Pressable>
      <Text style={styles.title}>Mis favoritos</Text>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 50 }]}>
        {favorites.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={48} color="#ccc" />
            <Text style={styles.empty}>No tienes recetas favoritas guardadas.</Text>
            <Text style={styles.emptySubtitle}>
              Toca el corazón en cualquier receta para agregarla a favoritos
            </Text>
          </View>
        )}
        {favorites.map((recipe, idx) => (
          <View key={recipe._id || idx} style={styles.recipeRow}>
            {recipe.customized && (
              <View style={styles.customizedTagLeft}>
                <Ionicons name="construct" size={16} color="#025E45" />
                <Text style={styles.customizedText}>Modificado a tu gusto</Text>
              </View>
            )}
            <RecipeCard
              id={recipe._id}
              title={recipe.title}
              category={recipe.category}
              author={recipe.user}
              imageUrl={recipe.image_url}
              rating={recipe.averageRating || 0}
              isFavorite={true}
              onToggleFavorite={() => handleRemoveFavorite(recipe._id, !!recipe.customized)}
              onPress={() => {
                if (recipe.customized) {
                  router.push({
                    pathname: '/receta/[id]',
                    params: { id: recipe._id, favoriteData: JSON.stringify(recipe), fromFavorites: '1' }
                  });
                } else {
                  router.push({
                    pathname: '/receta/[id]',
                    params: { id: recipe._id, fromFavorites: '1' }
                  });
                }
              }}
              userRole={userRole}
              variant="compact"
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#025E45',
    textAlign: 'center',
    marginTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
  emptySubtitle: {
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
  },
  recipeRow: {
    marginBottom: 10,
    position: 'relative',
    width: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: 0,
    marginHorizontal: 0,
  },
  customizedTagLeft: {
    position: 'absolute',
    left: 24,
    top: 18,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 2,
  },
  customizedText: {
    color: '#025E45',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 120,
  },
  guestTitle: {
    fontSize: 15,
    marginBottom: 10,
    color: '#222',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  guestSubtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 18,
    fontSize: 13,
  },
  loginButton: {
    backgroundColor: '#025E45',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
    marginTop: 18,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  scrollContent: {
    alignItems: 'stretch',
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  closeButton: {
    position: 'absolute',
    top: 28,
    right: 18,
    zIndex: 10,
  },
}); 