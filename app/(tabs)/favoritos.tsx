import { ProtectedPage } from '@/components/ProtectedPage';
import RecipeCard from '@/components/receta/RecipeCard';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFavorite } from '../../contexts/FavoriteContext';

interface FavoriteRecipe {
  _id: string;
  title: string;
  category: string;
  image_url: string;
  user: string;
  publishedDate: string;
  averageRating: number;
}

export default function FavoritosScreen() {
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const { refreshFavorites } = useFavorite();

  useEffect(() => {
    const loadToken = async () => {
      try {
        // Leer el token desde authToken
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          setToken(token);
          console.log('TOKEN FAVORITOS (authToken):', token);
          return;
        }
        // Compatibilidad: intentar leer desde userInfo.token si no existe authToken
        const userInfoString = await AsyncStorage.getItem('userInfo');
        if (userInfoString) {
          const userInfo = JSON.parse(userInfoString);
          if (userInfo.token) {
            setToken(userInfo.token);
            console.log('TOKEN FAVORITOS (userInfo.token):', userInfo.token);
          }
        } else {
          console.log('No se encontró userInfo ni authToken en AsyncStorage');
        }
      } catch (error) {
        console.error('Error loading token:', error);
      }
    };
    loadToken();
  }, []);

  useEffect(() => {
    if (token) {
      fetchFavorites();
    }
  }, [token]);

  // Refrescar favoritos cada vez que la pantalla obtiene foco
  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        fetchFavorites();
      }
    }, [token])
  );

  const fetchFavorites = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch('https://bon-appetit-production.up.railway.app/api/favourite-recipies', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      console.log('RESPUESTA FAVORITOS:', data);
      
      if (response.ok && data.status === 'success') {
        setFavorites(data.recipes || []);
      } else {
        console.error('Error fetching favorites:', data);
        Alert.alert('Error', 'No se pudieron cargar los favoritos');
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      Alert.alert('Error', 'Error de conexión al cargar favoritos');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (recipeId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`https://bon-appetit-production.up.railway.app/api/favourite-recipies/${recipeId}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (response.ok && data.status === 'success') {
        setFavorites(prev => prev.filter(recipe => recipe._id !== recipeId));
        Alert.alert('Éxito', 'Receta eliminada de favoritos');
        await refreshFavorites();
      } else {
        console.error('Error removing favorite:', data);
        Alert.alert('Error', data.message || 'Error al eliminar de favoritos');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      Alert.alert('Error', 'Error de conexión al eliminar favorito');
    }
  };

  const handleBack = () => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  if (loading) {
    return (
      <ProtectedPage pageName="favoritos">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={28} color="#025E45" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/bon-appetit-logo.png')}
                style={styles.logo}
                contentFit="contain"
              />
            </View>
            <View style={{ width: 28 }} />
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando favoritos...</Text>
          </View>
        </View>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage pageName="favoritos">
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#025E45" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/bon-appetit-logo.png')}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <View style={{ width: 28 }} />
        </View>
        <View style={styles.topSection}>
          <Text style={styles.title}>Tus Favoritos</Text>
        </View>
        <ScrollView>
          {favorites.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="heart-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>No tienes recetas favoritas guardadas.</Text>
              <Text style={styles.emptySubtext}>Toca el corazón en cualquier receta para agregarla a favoritos</Text>
            </View>
          )}
          {favorites.map((recipe) => (
            <View key={recipe._id} style={styles.recipeRow}>
              <RecipeCard
                id={recipe._id}
                title={recipe.title}
                category={recipe.category}
                author={recipe.user}
                imageUrl={recipe.image_url}
                rating={recipe.averageRating || 0}
                isFavorite={true}
                onToggleFavorite={() => handleRemoveFavorite(recipe._id)}
                onPress={() => router.push({
                  pathname: '/receta/[id]',
                  params: { id: recipe._id }
                })}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    </ProtectedPage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F6F6F6',
  },
  backButton: {
    width: 28,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 72,
  },
  topSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  recipeRow: {
    marginBottom: 18,
    position: 'relative',
  },
}); 