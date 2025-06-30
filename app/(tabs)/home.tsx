// app/home.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import RecipeCard from '@/components/receta/RecipeCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AppLogo } from '@/components/ui/AppLogo';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { useFavorite } from '../../contexts/FavoriteContext';

export default function HomeScreen() {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorite();

  const [categories, setCategories] = useState<{
    id: string;
    name: string;
    iconUrl: string;
  }[]>([]);

  const [recentRecipes, setRecentRecipes] = useState<{
    id: string;
    title: string;
    category: string;
    author: string;
    imageUrl: string;
    rating: number;
  }[]>([]);

  const [favoriteRecipes, setFavoriteRecipes] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('https://bon-appetit-production.up.railway.app/api/categories');
        const data = await response.json();
        if (data.status === "success") {
          setCategories(data.categories.map((cat: any) => ({ id: cat._id, name: cat.name, iconUrl: cat.iconUrl || '' })));
        } else {
          console.error("Failed to fetch categories:", data.error);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    const fetchRecentRecipes = async () => {
      try {
        const response = await fetch('https://bon-appetit-production.up.railway.app/api/recipies?limit=3&sortBy=publishedDate&order=desc');
        const data = await response.json();
        if (data.status === "success") {
          setRecentRecipes(data.payload.map((recipe: any) => ({
            id: recipe._id,
            title: recipe.title,
            category: recipe.category,
            author: recipe.user,
            imageUrl: recipe.image_url,
            rating: recipe.averageRating || 0,
          })));
        } else {
          console.error("Failed to fetch recent recipes:", data.error);
        }
      } catch (error) {
        console.error("Error fetching recent recipes:", error);
      }
    };
    const fetchFavoriteRecipes = async () => {
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
          setFavoriteRecipes(data.recipes || []);
        }
      } catch (e) {
        // handle error
      }
    };

    fetchCategories();
    fetchRecentRecipes();
    fetchFavoriteRecipes();
  }, []);

  const handleCardPress = (id: string) => {
    console.log(`Recipe card ${id} pressed`);
    // Lógica para navegar a la pantalla de detalles de la receta
  };

  return (
    <>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <ThemedView style={styles.container}>
        {/* Logo */}
        <AppLogo width={150} height={72} marginBottom={24} />

        {/* Search bar */}
        <TouchableOpacity style={styles.searchContainer} onPress={() => router.push('/search')}>
          <Text style={styles.searchText}>Busca recetas por nombre, ingrediente o usuario</Text>
          <IconSymbol name="magnifyingglass" size={20} color="#9E9E9E" />
        </TouchableOpacity>


        <ScrollView>
          {/* Section: Recetas recién agregadas */}
          <ThemedText type="defaultSemiBold" style={styles.sectionHeader}>
            Recetas recién agregadas
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {recentRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                category={recipe.category}
                author={recipe.author}
                imageUrl={recipe.imageUrl}
                rating={recipe.rating}
                onToggleFavorite={() => toggleFavorite(recipe.id)}
                isFavorite={isFavorite(recipe.id)}
              />
            ))}
          </ScrollView>

          {/* Section: Categorías */}
          <ThemedText type="defaultSemiBold" style={styles.sectionHeader}>
            Categorías
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                title={category.name}
                imageUrl={category.iconUrl}
                onPress={() => router.push({ pathname: '/searchByCategory', params: { category: category.name } })}
              />
            ))}
          </ScrollView>

          {/* Section: Tus favoritas */}
          <ThemedText type="defaultSemiBold" style={styles.sectionHeader}>
            Tus favoritas
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {favoriteRecipes
              .slice()
              .sort((a, b) => a.title.localeCompare(b.title))
              .slice(0, 3)
              .map((recipe) => (
                <RecipeCard
                  key={recipe._id}
                  id={recipe._id}
                  title={recipe.title}
                  category={recipe.category}
                  author={recipe.user}
                  imageUrl={recipe.image_url}
                  rating={recipe.averageRating || 0}
                  onToggleFavorite={() => toggleFavorite(recipe._id)}
                  isFavorite={isFavorite(recipe._id)}
                />
              ))}
          </ScrollView>
          <View style={{ height: 32 }} />
        </ScrollView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  logo: {
    width: 150,
    height: 72,
    alignSelf: 'center',   
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 32,
  },
  searchText: {
    flex: 1,
    color: '#9E9E9E',
  },
  sectionHeader: {
    color: '#025E45',
    fontSize: 16,
    marginBottom: 12,
  },
  horizontalScroll: {
    paddingBottom: 16,
    marginBottom: 24,
  },
});
