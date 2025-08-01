// app/home.tsx
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import RecipeCard from '@/components/receta/RecipeCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AppLogo } from '@/components/ui/AppLogo';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { IconSymbol } from '../../components/ui/IconSymbol';
import { useFavorite } from '../../contexts/FavoriteContext';

export default function HomeScreen() {
  const router = useRouter();
  const { isFavorite, toggleFavorite, favoriteIds, refreshFavorites } = useFavorite();
  const userRole = useUserRole();
  const { token } = useAuth();

  const [categories, setCategories] = useState<{
    id: string;
    name: string;
    iconUrl: string;
  }[]>([]);

  const [recentRecipes, setRecentRecipes] = useState<any[]>([]);
  const [topFavoriteRecipes, setTopFavoriteRecipes] = useState<any[]>([]);
  const [loadingFavorites, setLoadingFavorites] = useState(false);

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
        const response = await fetch('https://bon-appetit-production.up.railway.app/api/recipies?limit=3&sortBy=publishedDate&order=desc&isVerificated=true');
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

    fetchCategories();
    fetchRecentRecipes();
  }, []);

  const fetchTopFavorites = async () => {
    setLoadingFavorites(true);
    try {
      if (!token) {
        setTopFavoriteRecipes([]);
        setLoadingFavorites(false);
        return;
      }
      const response = await fetch('https://bon-appetit-production.up.railway.app/api/favourite-recipies', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data.status === 'success') {
        // Tomar solo las primeras 3 recetas favoritas
        setTopFavoriteRecipes((data.recipes || []).slice(0, 3));
      } else {
        setTopFavoriteRecipes([]);
      }
    } catch (error) {
      console.error('Error fetching top favorites:', error);
      setTopFavoriteRecipes([]);
    } finally {
      setLoadingFavorites(false);
    }
  };

  useEffect(() => {
    fetchTopFavorites();
  }, [token]);

  useFocusEffect(
    React.useCallback(() => {
      refreshFavorites();
      fetchTopFavorites();
    }, [refreshFavorites, token])
  );

  const handleToggleFavorite = async (id: string) => {
    await toggleFavorite(id);
    await refreshFavorites();
  };

  const handleRemoveFavoriteCard = async (id: string) => {
    // Marca la card como en proceso de eliminación (para opacidad)
    setTopFavoriteRecipes(prev => prev.map(recipe =>
      recipe._id === id ? { ...recipe, _removing: true } : recipe
    ));
    setTimeout(async () => {
      setTopFavoriteRecipes(prev => prev.filter(recipe => recipe._id !== id));
      await toggleFavorite(id);
      await refreshFavorites();
    }, 400);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <ThemedView style={styles.container}>
          <AppLogo width={150} height={69} marginBottom={8} />
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
                onToggleFavorite={() => handleToggleFavorite(recipe.id)}
                isFavorite={isFavorite(recipe.id)}
                userRole={userRole}
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
            contentContainerStyle={[styles.horizontalScroll, { marginBottom: 20 }]}
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
            {loadingFavorites ? (
              <View style={{ justifyContent: 'center', alignItems: 'center', height: 120 }}>
                <Text style={{ color: '#888' }}>Cargando favoritos...</Text>
              </View>
            ) : topFavoriteRecipes.length === 0 ? (
              <View style={{ justifyContent: 'center', alignItems: 'center', height: 120 }}>
                <Text style={{ color: '#888' }}>No tienes recetas favoritas guardadas.</Text>
              </View>
            ) : (
              topFavoriteRecipes.map((recipe: any) => (
                <RecipeCard
                  key={recipe._id}
                  id={recipe._id}
                  title={recipe.title}
                  category={recipe.category}
                  author={recipe.user}
                  imageUrl={recipe.image_url}
                  rating={recipe.averageRating || 0}
                  isFavorite={true}
                  userRole={userRole}
                  onToggleFavorite={() => handleRemoveFavoriteCard(recipe._id)}
                  style={recipe._removing ? { opacity: 0.5 } : undefined}
                />
              ))
            )}
          </ScrollView>
          <View style={{ height: 62 }} />
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
    marginBottom: 22   ,
  },
  searchText: {
    flex: 1,
    color: '#9E9E9E',
  },
  sectionHeader: {
    color: '#025E45',
    fontSize: 17,
    fontFamily:'Montserrat-Semibold',
    fontWeight: '600',
    marginBottom: 10,
  },
  horizontalScroll: {
    paddingBottom: 1,
    marginBottom: 5,
  },
});
