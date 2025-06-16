import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { RecipeRatingModal } from '@/components/receta/RecipeRatingModal';

interface Ingredient {
  name: string;
  quantity: number | string;
  unit: string;
}

interface Step {
  texto: string;
  urls?: string[];
}

interface Recipe {
  _id: string;
  title: string;
  description: string;
  category: string;
  portions: number;
  image_url: string;
  ingredients: Ingredient[];
  user: string;
  publishedDate: string;
  stepsList: Step[];
  averageRating: number;
  rating: any[];
  aditionalMedia: string[];
  isVerificated: boolean;
}

export default function RecipePage() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const router = useRouter();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portions, setPortions] = useState<number>(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Safe back navigation
  const handleBack = () => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace('/'); // Go to home if no back stack
    }
  };

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(`https://bon-appetit-production.up.railway.app/api/recipies/${id}`);
        const data = await response.json();
        if (data.status === "success") {
          const foundRecipe = Array.isArray(data.payload) ? data.payload[0] : data.payload;
          if (foundRecipe) {
            setRecipe(foundRecipe);
            setPortions(foundRecipe.portions || 1);
          } else {
            setError("Receta no encontrada");
          }
        } else {
          setError("No se pudo cargar la receta");
        }
      } catch (err) {
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
  }, [id]);

  const handleFavorite = () => setIsFavorite((prev) => !prev);
  const handlePortionChange = (delta: number) => {
    setPortions((prev) => Math.max(1, prev + delta));
  };

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

  // Debug: log stepsList before rendering
  console.log('Recipe stepsList:', recipe.stepsList);

  return (
    <ScrollView style={{ backgroundColor: '#F6F6F6' }} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header with centered logo */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#025E45" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/bon-appetit-logo.svg')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>
        <View style={{ width: 28 }} /> {/* Spacer to balance the back button */}
      </View>

      {/* Title, author, rating */}
      <View style={styles.topSection}>
        <ThemedText type="title" style={styles.recipeTitle}>{recipe.title}</ThemedText>
        <View style={styles.rowCenter}>
          <ThemedText style={styles.author}>@{recipe.user}</ThemedText>
          <ThemedText style={styles.rating}>{Number(recipe.averageRating || 0).toFixed(1)}</ThemedText>
          <Ionicons name="star" size={18} color="#FFD700" style={{ marginLeft: 2 }} />
        </View>
      </View>

      {/* Main image */}
      <Image source={{ uri: recipe.image_url }} style={styles.mainImage} contentFit="cover" />

      {/* Category, favorite, portions */}
      <View style={styles.infoRow}>
        <ThemedText style={styles.category}>{recipe.category}</ThemedText>
        <TouchableOpacity style={styles.favoriteBtn} onPress={handleFavorite}>
          <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? '#FF6347' : '#888'} />
          <Text style={{ marginLeft: 6, color: '#333' }}>{isFavorite ? 'Favorito' : 'Añadir a favoritos'}</Text>
        </TouchableOpacity>
      </View>

      {/* Ingredients */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>Ingredientes</ThemedText>
      <View style={styles.portionRow}>
        <Ionicons name="people-outline" size={18} color="#666" />
        <ThemedText style={styles.portionText}>{portions} porción{portions > 1 ? 'es' : ''}</ThemedText>
        <TouchableOpacity style={styles.portionBtn} onPress={() => handlePortionChange(-1)}>
          <Ionicons name="remove-circle-outline" size={22} color="#025E45" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.portionBtn} onPress={() => handlePortionChange(1)}>
          <Ionicons name="add-circle-outline" size={22} color="#025E45" />
        </TouchableOpacity>
      </View>
      <View style={styles.ingredientBox}>
        {(recipe.ingredients || []).map((ing, idx) => (
          <ThemedText key={idx} style={styles.ingredientText}>
            {ing.quantity} {ing.unit} {ing.name}
          </ThemedText>
        ))}
      </View>

      {/* Steps */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>Paso a paso</ThemedText>
      {(recipe.stepsList || []).map((step, idx, arr) => (
        <View
          key={idx}
          style={[
            styles.stepBox,
            idx === arr.length - 1 && { marginBottom: 0 }
          ]}
        >
          <ThemedText style={styles.stepText}>{idx + 1}. {step.texto}</ThemedText>
          {step.urls && step.urls.length > 0 && (
            <Image source={{ uri: step.urls[0].startsWith('http') ? step.urls[0] : `https://bon-appetit-production.up.railway.app${step.urls[0]}` }} style={styles.stepImage} contentFit="cover" />
          )}
        </View>
      ))}

      {/* Evaluate button */}
      <TouchableOpacity style={styles.evalBtn} onPress={() => setShowRatingModal(true)}>
        <Text style={styles.evalBtnText}>Evaluar Receta</Text>
      </TouchableOpacity>

      {/* Comments section (placeholder) */}
      <ThemedText type="subtitle" style={styles.sectionTitle}>Comentarios</ThemedText>
      <View style={styles.commentBox}>
        <View style={styles.commentHeader}>
          <Ionicons name="person-circle-outline" size={32} color="#025E45" />
          <View style={{ marginLeft: 8 }}>
            <ThemedText style={styles.commentUser}>@carlos - 1/03/2024</ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <ThemedText style={styles.commentRating}>4</ThemedText>
            </View>
          </View>
        </View>
        <ThemedText style={styles.commentText}>La voy a hacer y recomiendo. Desde hoy, es mi ensalada preferida</ThemedText>
      </View>
      <RecipeRatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        recipeTitle={recipe.title}
        onSubmit={async (rating, comment) => {
          // TODO: send rating/comment to your API
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  recipeTitle: {
    color: '#055B49',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  author: {
    color: '#616161',
    fontWeight: '600',
    marginRight: 12,
  },
  rating: {
    fontSize: 16,
    color: '#333',
    marginRight: 2,
  },
  mainImage: {
    width: '90%',
    height: 180,
    borderRadius: 12,
    alignSelf: 'center',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  category: {
    color: '#555555',
    fontWeight: '600',
    fontSize: 16,
  },
  favoriteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginBottom: 8,
  },
  portionText: {
    marginLeft: 6,
    marginRight: 8,
    fontWeight: '600',
    color: '#333',
  },
  portionBtn: {
    marginHorizontal: 2,
  },
  ingredientBox: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginHorizontal: 16,
    padding: 12,
    marginBottom: 12,
  },
  ingredientText: {
    fontSize: 15,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  stepBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
  },
  stepText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
    fontWeight: 'bold',
  },
  stepImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 4,
  },
  evalBtn: {
    backgroundColor: '#055B49',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  evalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  commentBox: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginHorizontal: 16,
    padding: 12,
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: '600',
    color: '#025E45',
  },
  commentRating: {
    marginLeft: 4,
    color: '#333',
    fontWeight: 'bold',
  },
  commentText: {
    color: '#333',
    fontSize: 15,
    marginTop: 2,
  },
}); 