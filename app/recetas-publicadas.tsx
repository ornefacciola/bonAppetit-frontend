import RecipeCard from '@/components/receta/RecipeCard';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Recipe {
  _id: string;
  title: string;
  category: string;
  user: string;
  image_url: string;
  averageRating: number;
  isVerificated: boolean;
}

export default function PerfilRecetasPublicadas() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRecipes = async () => {
      try {
        // Obtener información del usuario logueado
        const userInfoString = await AsyncStorage.getItem('userInfo');
        if (!userInfoString) {
          setError('No se pudo obtener la información del usuario');
          setLoading(false);
          return;
        }

        const userInfo = JSON.parse(userInfoString);
        
        // Obtener todas las recetas
        const response = await fetch('https://bon-appetit-production.up.railway.app/api/recipies');
        const data = await response.json();
        
        if (data.status === 'success') {
          // Filtrar recetas del usuario que estén verificadas (publicadas)
          const userRecipes = data.payload.filter((recipe: Recipe) => 
            recipe.user === userInfo.alias && recipe.isVerificated === true
          );
          setRecipes(userRecipes);
        } else {
          setError('No se pudieron cargar las recetas');
        }
      } catch (error) {
        console.error('Error fetching recipes:', error);
        setError('Error al cargar las recetas');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRecipes();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="arrow-back" size={24} onPress={() => router.back()} />
          <Text style={styles.title}>Mis recetas publicadas</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#025E45" />
          <Text style={styles.loadingText}>Cargando recetas...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="arrow-back" size={24} onPress={() => router.back()} />
          <Text style={styles.title}>Mis recetas publicadas</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} onPress={() => router.back()} />
        <Text style={styles.title}>Mis recetas publicadas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {recipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tienes recetas publicadas</Text>
          </View>
        ) : (
          recipes.map((recipe) => (
            <RecipeCard
              key={recipe._id}
              id={recipe._id}
              title={recipe.title}
              category={recipe.category}
              author={recipe.user}
              imageUrl={recipe.image_url}
              rating={recipe.averageRating || 0}
              onPress={() => {}}
              onToggleFavorite={() => {}}
              isFavorite={false}
              variant="compact"
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
    marginTop: 9,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scroll: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
});
