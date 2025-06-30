import RecipeCard from '@/components/receta/RecipeCard';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AppLogo } from '@/components/ui/AppLogo';
import { CategoryCard } from '@/components/ui/CategoryCard';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { OrderModal } from '@/components/ui/OrderModal';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFavorite } from '../contexts/FavoriteContext';

const ORDER_OPTIONS = [
  { label: "Más nuevo a más viejo", value: "publishedDate_desc" },
  { label: "Más viejo a más nuevo", value: "publishedDate_asc" },
  { label: "Alfabéticamente (A a Z)", value: "title_asc" },
  { label: "Alfabéticamente (Z a A)", value: "title_desc" },
];

export default function SearchByCategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialCategory = params.category as string | undefined;

  const [categories, setCategories] = useState<{ id: string; name: string; iconUrl: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState('publishedDate_desc');

  const { isFavorite, toggleFavorite } = useFavorite();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('https://bon-appetit-production.up.railway.app/api/categories');
        const data = await response.json();
        if (data.status === 'success') {
          setCategories(data.categories.map((cat: any) => ({ id: cat._id, name: cat.name, iconUrl: cat.iconUrl || '' })));
        }
      } catch (error) {
        // handle error
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      setLoading(true);
      const [sortBy, order] = selectedOrder.split('_');
      fetch(`https://bon-appetit-production.up.railway.app/api/recipies?category=${encodeURIComponent(selectedCategory)}&sortBy=${sortBy}&order=${order}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success') {
            setRecipes(data.payload.map((recipe: any) => ({
              id: recipe._id,
              title: recipe.title,
              category: recipe.category,
              author: recipe.user,
              imageUrl: recipe.image_url,
              rating: recipe.averageRating || 0,
            })));
          } else {
            setRecipes([]);
          }
        })
        .catch(() => setRecipes([]))
        .finally(() => setLoading(false));
    } else {
      setRecipes([]);
    }
  }, [selectedCategory, selectedOrder]);

  return (
    <>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <ThemedView style={styles.container}>
        {/* Header con logo y flecha en la misma línea */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color="#025E45" />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Pressable onPress={() => router.push('/(tabs)/home')}>
              <AppLogo width={150} height={72} style={{ alignSelf: 'center' }} />
            </Pressable>
          </View>
          <View style={{ width: 28 }} />
        </View>
        <TouchableOpacity style={styles.searchContainer} onPress={() => router.push('/search')}>
          <Text style={styles.searchText}>Busca recetas por nombre, ingrediente o usuario</Text>
          <IconSymbol name="magnifyingglass" size={20} color="#9E9E9E" />
        </TouchableOpacity>

        {/* Sección de Categorías (idéntica a home.tsx) */}
        <ThemedText type="defaultSemiBold" style={styles.sectionHeader}>Categorías</ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
          style={{ maxHeight: 140 }}
        >
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              title={category.name}
              imageUrl={category.iconUrl}
              onPress={() => setSelectedCategory(category.name)}
              selected={selectedCategory === category.name}
            />
          ))}
        </ScrollView>

        {/* Resultados de recetas y botón de ordenar en la misma línea */}
        {selectedCategory && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <ThemedText style={[styles.resultsText, { marginBottom: 0 }]}>{recipes.length} Resultados</ThemedText>
            <TouchableOpacity style={{ backgroundColor: '#E5E5E5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }} onPress={() => setOrderModalVisible(true)}>
              <Text style={{ color: '#333', marginBottom: 0 }}>Ordenar ▾</Text>
            </TouchableOpacity>
          </View>
        )}
        <OrderModal
          visible={orderModalVisible}
          selected={selectedOrder}
          onSelect={(value) => setSelectedOrder(value)}
          onClose={() => setOrderModalVisible(false)}
          options={ORDER_OPTIONS}
        />

        {/* FlatList SOLO para recetas, nunca envuelve categorías */}
        <FlatList
          data={loading ? [] : recipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <RecipeCard
              key={item.id}
              id={item.id}
              title={item.title}
              category={item.category}
              author={item.author}
              imageUrl={item.imageUrl}
              rating={item.rating}
              onToggleFavorite={() => toggleFavorite(item.id)}
              isFavorite={isFavorite(item.id)}
              variant="compact"
            />
          )}
          ListEmptyComponent={loading ? (
            <Text style={{ textAlign: 'center', marginTop: 32 }}>Cargando recetas...</Text>
          ) : null}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 24,
    paddingTop: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    marginBottom: 12,
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
  resultsText: {
    color: '#025E45',
    fontSize: 15,
    marginBottom: 8,
    marginLeft: 4,
  },
}); 