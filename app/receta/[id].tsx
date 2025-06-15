import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

interface Recipe {
  _id: string;
  title: string;
  category: string;
  image_url: string;
  user: string;
  publishedDate: string;
  averageRating: number;
}

export default function RecipePage() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('RecipePage mounted with params:', params);
    console.log('Recipe ID:', id);
    
    const fetchRecipe = async () => {
      try {
        // First try to get all recipes
        console.log('Fetching all recipes');
        const response = await fetch('https://bon-appetit-production.up.railway.app/api/recipies');
        const data = await response.json();
        console.log('API Response:', data);
        
        if (data.status === "success") {
          // Find the specific recipe by ID
          const foundRecipe = data.payload.find((r: Recipe) => r._id === id);
          console.log('Found recipe:', foundRecipe);
          
          if (foundRecipe) {
            setRecipe(foundRecipe);
          } else {
            setError("Receta no encontrada");
          }
        } else {
          setError("No se pudo cargar la receta");
        }
      } catch (err) {
        console.error("Error fetching recipe:", err);
        setError("Error al cargar la receta");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRecipe();
    } else {
      setError("ID de receta no proporcionado");
      setLoading(false);
    }
  }, [id, params]);

  if (loading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#025E45" />
      </ThemedView>
    );
  }

  if (error || !recipe) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText type="title">{error || "Receta no encontrada"}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header with back button */}
      <View style={styles.header}>
        <Ionicons 
          name="arrow-back" 
          size={24} 
          onPress={() => router.back()} 
          style={styles.backButton}
        />
      </View>

      <ScrollView>
        {/* Recipe Image */}
        <Image
          source={{ uri: recipe.image_url }}
          style={styles.image}
          contentFit="cover"
        />

        {/* Recipe Content */}
        <View style={styles.content}>
          <ThemedText type="title" style={styles.title}>
            {recipe.title}
          </ThemedText>

          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="person-outline" size={20} color="#666" />
              <ThemedText style={styles.metaText}>@{recipe.user}</ThemedText>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="restaurant-outline" size={20} color="#666" />
              <ThemedText style={styles.metaText}>{recipe.category}</ThemedText>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="star" size={20} color="#FFD700" />
              <ThemedText style={styles.metaText}>
                {recipe.averageRating.toFixed(1)}
              </ThemedText>
            </View>
          </View>

          {/* Add more recipe details here as needed */}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
  },
  backButton: {
    color: '#333',
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 16,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 16,
    color: '#666',
  },
}); 