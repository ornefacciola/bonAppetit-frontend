import RecipeCard from '@/components/receta/RecipeCard';
import { AppLogo } from '@/components/ui/AppLogo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function FavoritosScreen() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const data = await AsyncStorage.getItem('favoriteRecipes');
        if (data) {
          setFavorites(JSON.parse(data));
        }
      } catch (e) {
        setFavorites([]);
      }
    };
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (id: string, customized: boolean) => {
    try {
      const data = await AsyncStorage.getItem('favoriteRecipes');
      let favs = data ? JSON.parse(data) : [];
      favs = favs.filter((r: any) => !(r._id === id && (!!r.customized) === customized));
      await AsyncStorage.setItem('favoriteRecipes', JSON.stringify(favs));
      setFavorites(favs);
    } catch (e) {
      alert('Error al eliminar favorito');
    }
  };

  const handleBack = () => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoHeader}>
        <AppLogo width={150} height={72} style={{ alignSelf: 'center' }} />
      </View>
      <View style={styles.rowHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#025E45" />
        </TouchableOpacity>
        <Text style={styles.title}>Mis recetas favoritas</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView>
        {favorites.length === 0 && (
          <Text style={styles.empty}>No tienes recetas favoritas guardadas.</Text>
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
              onPress={() => router.push({
                pathname: '/receta/[id]',
                params: { id: recipe._id, favoriteData: JSON.stringify(recipe), fromFavorites: '1' }
              })}
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
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  logoHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 8,
    backgroundColor: '#F6F6F6',
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backButton: {
    width: 28,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#025E45',
    textAlign: 'center',
  },
  empty: {
    color: '#888',
    textAlign: 'center',
    marginTop: 40,
  },
  recipeRow: {
    marginBottom: 18,
    position: 'relative',
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
}); 