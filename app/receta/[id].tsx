import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import { AppLogo } from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useFavorite } from '../../contexts/FavoriteContext';

// --- PARSEADORES ROBUSTOS ---
function parseIngredientes(arr: any[] = []) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  return arr.map((i: any) => ({
    name: i.name || i.nombre || i.ingredient || '',
    quantity:
      i.quantity !== undefined
        ? i.quantity
        : i.cantidad !== undefined
        ? i.cantidad
        : '',
    unit: i.unit || i.unidad || i.medida || '',
  }));
}
function parseSteps(arr: any[] = []) {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  return arr.map((p: any) => ({
    texto: p.texto || p.descripcion || p.description || '',
    urls: p.urls || (p.media ? [p.media] : p.image ? [p.image] : []),
  }));
}

interface Ingredient {
  name: string;
  quantity: number | string;
  unit: string;
}
interface Step {
  texto: string;
  urls?: string[];
}
interface Rating {
  rate: number;
  user: string;
  createdAt: number;
  comment?: string;
  isCommentVerified?: boolean;
  id?: string;
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
  rating: Rating[];
  aditionalMedia: string[];
  isVerificated: boolean;
}

export default function RecipePage() {
  const params = useLocalSearchParams();
  const id = params.id as string;
  const router = useRouter();
  const navigation = useNavigation();
  const { token } = useAuth();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [parsedIngredients, setParsedIngredients] = useState<Ingredient[]>([]);
  const [parsedSteps, setParsedSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portions, setPortions] = useState<number>(1);
  const [isCustomFavorite, setIsCustomFavorite] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedIngredientIdx, setSelectedIngredientIdx] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [adjustedIngredients, setAdjustedIngredients] = useState<Ingredient[]>([]);
  const [hasCustom, setHasCustom] = useState(false);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [customBaseIngredients, setCustomBaseIngredients] = useState<Ingredient[] | null>(null);
  const userRole = useUserRole();
  const { isFavorite: contextIsFavorite, toggleFavorite } = useFavorite();
  const [showGuestModal, setShowGuestModal] = useState(false);

  // Safe back navigation
  const handleBack = () => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch(
          `https://bon-appetit-production.up.railway.app/api/recipies/${id}`
        );
        const data = await response.json();
        if (data.status === 'success') {
          const foundRecipe = Array.isArray(data.payload)
            ? data.payload[0]
            : data.payload;
          if (foundRecipe) {
            setRecipe(foundRecipe);

            // --- PARSEO ROBUSTO PARA CUALQUIER FORMATO ---
            const parsedIng = parseIngredientes(foundRecipe.ingredients);
            setParsedIngredients(parsedIng);
            setPortions(foundRecipe.portions || 1);
            setParsedSteps(parseSteps(foundRecipe.stepsList));
          } else {
            setError('Receta no encontrada');
          }
        } else {
          setError('No se pudo cargar la receta');
        }
      } catch (err) {
        setError('Error al cargar la receta');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchRecipe();
    } else {
      setError('ID de receta no proporcionado');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (parsedIngredients && !isPersonalized) {
      setAdjustedIngredients(parsedIngredients.map(ing => ({ ...ing })));
    }
  }, [parsedIngredients, isPersonalized]);

  // When loading a favorite, set both base and portions
  useEffect(() => {
    if (params && params.favoriteData) {
      const favData = JSON.parse(params.favoriteData as string);
      setIsPersonalized(true);
      setCustomBaseIngredients(favData.ingredients);
      setPortions(favData.savedPortions);
    } else {
      setIsPersonalized(false);
      setCustomBaseIngredients(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Recalculate adjustedIngredients when base or portions changes
  useEffect(() => {
    if (isPersonalized && customBaseIngredients) {
      setAdjustedIngredients(
        customBaseIngredients.map((ing: Ingredient) => ({
          ...ing,
          quantity: typeof ing.quantity === 'number'
            ? +(ing.quantity as number) * (portions / (customBaseIngredients.length > 0 ? portions : 1))
            : ing.quantity
        }))
      );
    } else if (parsedIngredients && !isPersonalized && recipe) {
      const factor = portions / (recipe.portions || 1);
      setAdjustedIngredients(
        parsedIngredients.map((ing: Ingredient) => ({
          ...ing,
          quantity: typeof ing.quantity === 'number' ? +(ing.quantity as number) * factor : ing.quantity
        }))
      );
    }
  }, [portions, customBaseIngredients, isPersonalized, parsedIngredients, recipe]);

  useEffect(() => {
    if (!parsedIngredients) return;
    const isCustom = JSON.stringify(adjustedIngredients) !== JSON.stringify(parsedIngredients);
    setHasCustom(isCustom);
  }, [adjustedIngredients, parsedIngredients]);

  // ...El resto de tus métodos (favoritos, ratings, edición, etc.) pueden quedar igual...

  // --- RENDER ---
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
        <Text style={styles.recipeTitle}>{error || 'Receta no encontrada'}</Text>
      </ThemedView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: '#F6F6F6' }}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header with centered logo */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#025E45" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <Pressable onPress={() => router.push('/(tabs)/home')}>
            <AppLogo width={150} height={41} style={{ alignSelf: 'center' }} />
          </Pressable>
        </View>
        <View style={{ width: 28 }} />
      </View>

      {/* Title, author, rating */}
      <View style={styles.topSection}>
        <Text style={[styles.recipeTitle, { fontSize: 24, fontWeight: 'bold', color: '#055B49' }]}>
          {recipe.title}
        </Text>
        <View style={styles.rowCenter}>
          <Text style={styles.author}>
            @{recipe.user}
          </Text>
          <Text style={styles.rating}>
            {Number(recipe.averageRating || 0).toFixed(1)}
          </Text>
          <Ionicons
            name="star"
            size={18}
            color="#FFD700"
            style={{ marginLeft: 2 }}
          />
        </View>
      </View>

      {/* Main image */}
      {recipe.image_url ? (
        <Image
          source={{ uri: recipe.image_url }}
          style={styles.mainImage}
          contentFit="cover"
        />
      ) : (
        <Text
          style={{ textAlign: 'center', color: '#999', marginVertical: 16 }}
        >
          No image available
        </Text>
      )}

      {/* Category, portions */}
      <View style={styles.infoRow}>
        <Text style={styles.category}>
          {recipe.category}
        </Text>
      </View>


      <View style={styles.infoRow}>
        <Text style={{ fontSize: 16, }}>
          {recipe.description}
        </Text>
      </View>


      {/* Ingredients */}
      <Text style={[styles.sectionTitle, { fontWeight: 'bold', color: '#333' }]}>Ingredientes</Text>
      <View style={styles.portionRow}>
        <Ionicons
          name="people-outline"
          size={18}
          color="#666"
        />
        <Text style={styles.portionText}>
          {portions} porcion{portions > 1 ? 'es' : ''}
        </Text>
      </View>
      <View style={styles.ingredientBox}>
        {adjustedIngredients.length === 0
          ? <Text style={styles.ingredientText}>No hay ingredientes</Text>
          : adjustedIngredients.map((ing, idx) => (
            <Text key={idx} style={styles.ingredientText}>
              {ing.quantity} {ing.unit} {ing.name}
            </Text>
          ))}
      </View>

      {/* Steps */}
      <Text style={[styles.sectionTitle, { fontWeight: 'bold', color: '#333' }]}>Paso a paso</Text>
      {parsedSteps.length === 0
        ? <Text style={styles.ingredientText}>No hay pasos</Text>
        : parsedSteps.map((step, idx) => (
          <View key={idx} style={styles.stepBox}>
            <Text style={styles.stepText}>
              {idx + 1}. {step.texto}
            </Text>
            {step.urls?.length
              ? <Image source={{ uri: step.urls[0] }} style={styles.stepImage} contentFit="cover" />
              : null}
          </View>
        ))}

      {/* ...el resto de los modales y botones, igual que antes... */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F6F6F6'
  },
  backButton: {
    width: 28,
    alignItems: 'flex-start',
    justifyContent: 'center'
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 150,
    height: 72
  },
  topSection: {
    paddingHorizontal: 16,
    paddingBottom: 8
  },
  recipeTitle: {
    color: '#055B49',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  author: {
    color: '#616161',
    fontWeight: '600',
    marginRight: 12
  },
  rating: {
    fontSize: 16,
    color: '#333',
    marginRight: 2
  },
  mainImage: {
    width: '90%',
    height: 180,
    borderRadius: 12,
    alignSelf: 'center',
    marginVertical: 12
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8
  },
  category: {
    color: '#555555',
    fontWeight: '600',
    fontSize: 16
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    marginBottom: 8
  },
  portionText: {
    marginLeft: 6,
    marginRight: 8,
    fontWeight: '600',
    color: '#333'
  },
  ingredientBox: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginHorizontal: 16,
    padding: 12,
    marginBottom: 12
  },
  ingredientText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 2
  },
  stepBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12
  },
  stepText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 6,
  },
  stepImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 4
  },
});

