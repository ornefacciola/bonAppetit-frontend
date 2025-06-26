import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { ThemedView } from '@/components/ThemedView';
import { RecipeRatingModal } from '@/components/receta/RecipeRatingModal';
import SuccessModal from '@/components/ui/SuccessModal';

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
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portions, setPortions] = useState<number>(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCustomFavorite, setIsCustomFavorite] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedIngredientIdx, setSelectedIngredientIdx] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [adjustedIngredients, setAdjustedIngredients] = useState<Ingredient[]>([]);
  const [hasCustom, setHasCustom] = useState(false);
  const [isPersonalized, setIsPersonalized] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [customBaseIngredients, setCustomBaseIngredients] = useState<Ingredient[] | null>(null);

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
            setPortions(foundRecipe.portions || 1);
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
    if (recipe && !isPersonalized) {
      setAdjustedIngredients(recipe.ingredients.map(ing => ({ ...ing })));
    }
  }, [recipe, isPersonalized]);

  // Ajustar ingredientes al cambiar porciones
  useEffect(() => {
    if (isPersonalized && customBaseIngredients) {
      const basePortions = recipe?.portions || 1;
      const factor = portions / basePortions;
      setAdjustedIngredients(
        customBaseIngredients.map(ing => ({
          ...ing,
          quantity: typeof ing.quantity === 'number' ? +(ing.quantity as number) * factor : ing.quantity
        }))
      );
    } else if (recipe && !isPersonalized) {
      const factor = portions / (recipe.portions || 1);
      setAdjustedIngredients(
        recipe.ingredients.map(ing => ({
          ...ing,
          quantity: typeof ing.quantity === 'number' ? +(ing.quantity as number) * factor : ing.quantity
        }))
      );
    }
  }, [portions, recipe, isPersonalized, customBaseIngredients]);

  // Detectar si hay cambios personalizados
  useEffect(() => {
    if (!recipe) return;
    // Compara adjustedIngredients con recipe.ingredients
    const isCustom = JSON.stringify(adjustedIngredients) !== JSON.stringify(recipe.ingredients);
    setHasCustom(isCustom);
  }, [adjustedIngredients, recipe]);

  useEffect(() => {
    const checkIfFavorite = async () => {
      if (!recipe) return;
      const data = await AsyncStorage.getItem('favoriteRecipes');
      let favs = data ? JSON.parse(data) : [];
      const fav = favs.find((r: any) => r._id === recipe._id && JSON.stringify(r.ingredients) === JSON.stringify(adjustedIngredients));
      setIsFavorite(!!fav);
      setIsCustomFavorite(!!fav && !!fav.customized);
    };
    checkIfFavorite();
  }, [recipe, adjustedIngredients]);

  // Si la receta viene de favoritos y es personalizada, cargar los valores modificados SOLO una vez
  useEffect(() => {
    if (params && params.favoriteData) {
      const favData = JSON.parse(params.favoriteData as string);
      setAdjustedIngredients(favData.ingredients);
      setCustomBaseIngredients(favData.ingredients);
      setIsPersonalized(true);
    } else {
      setIsPersonalized(false);
      setCustomBaseIngredients(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleFavorite = () => setIsFavorite(prev => !prev);
  const handlePortionChange = (delta: number) => {
    setPortions(prev => Math.max(1, prev + delta));
  };

  // Lógica para editar un ingrediente y recalcular el resto
  const handleEditIngredient = () => {
    if (selectedIngredientIdx === null || !editQuantity || !recipe) return;
    const original = recipe.ingredients[selectedIngredientIdx];
    const originalQty = typeof original.quantity === 'number' ? original.quantity : parseFloat(original.quantity as string);
    const newQty = parseFloat(editQuantity);
    if (!originalQty || !newQty) return;
    const factor = newQty / originalQty;
    setAdjustedIngredients(
      recipe.ingredients.map((ing, idx) => ({
        ...ing,
        quantity: typeof ing.quantity === 'number' ? +(ing.quantity as number) * factor : ing.quantity
      }))
    );
    setEditModalVisible(false);
    setSelectedIngredientIdx(null);
    setEditQuantity('');
  };

  const verifiedComments =
    recipe?.rating?.filter(
      r => r.comment && r.isCommentVerified === true
    ) || [];

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Guardar receta personalizada en favoritos (reemplaza si ya existe)
  const handleSaveCustomFavorite = async () => {
    if (!recipe) return;
    try {
      const data = await AsyncStorage.getItem('favoriteRecipes');
      let favs = data ? JSON.parse(data) : [];
      // No guardar más de 10 (excepto si reemplaza una existente)
      const existsIdx = favs.findIndex((r: any) => r._id === recipe._id && r.customized);
      if (existsIdx !== -1) {
        favs[existsIdx] = { ...recipe, ingredients: adjustedIngredients, customized: true };
      } else {
        if (favs.length >= 10) {
          setShowSuccessModal(false);
          return alert('Solo puedes guardar hasta 10 recetas favoritas personalizadas.');
        }
        favs.push({ ...recipe, ingredients: adjustedIngredients, customized: true });
      }
      await AsyncStorage.setItem('favoriteRecipes', JSON.stringify(favs));
      setShowSuccessModal(true);
    } catch (e) {
      alert('Error al guardar la receta.');
    }
  };

  // Eliminar de favoritos
  const handleRemoveFavorite = async () => {
    if (!recipe) return;
    try {
      const data = await AsyncStorage.getItem('favoriteRecipes');
      let favs = data ? JSON.parse(data) : [];
      favs = favs.filter((r: any) => !(r._id === recipe._id && JSON.stringify(r.ingredients) === JSON.stringify(adjustedIngredients)));
      await AsyncStorage.setItem('favoriteRecipes', JSON.stringify(favs));
      setIsFavorite(false);
      // Si vino de favoritos, volver atrás
      if (params && params.fromFavorites) {
        router.back();
      }
    } catch (e) {
      alert('Error al eliminar favorito');
    }
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
          <Image
            source={require('@/assets/images/bon-appetit-logo.svg')}
            style={styles.logo}
            contentFit="contain"
          />
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
          <View style={styles.favoriteRow}>
            <TouchableOpacity
              style={styles.favoriteBtn}
              onPress={isFavorite ? handleRemoveFavorite : handleFavorite}
            >
              <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={22} color={isFavorite ? '#FF6347' : '#888'} />
            </TouchableOpacity>
            {isCustomFavorite && (
              <View style={styles.customizedTagRight}>
                <Ionicons name="construct" size={16} color="#025E45" />
                <Text style={styles.customizedText}>Modificado a tu gusto</Text>
              </View>
            )}
          </View>
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

      {/* Category, favorite, portions */}
      <View style={styles.infoRow}>
        <Text style={styles.category}>
          {recipe.category}
        </Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => setEditModalVisible(true)}
        >
          <Ionicons name="pencil" size={18} color="#888" />
        </TouchableOpacity>
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
          {portions} porción{portions > 1 ? 'es' : ''}
        </Text>
        <TouchableOpacity
          style={styles.portionBtn}
          onPress={() => handlePortionChange(-1)}
        >
          <Ionicons
            name="remove-circle-outline"
            size={22}
            color="#025E45"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.portionBtn}
          onPress={() => handlePortionChange(1)}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color="#025E45"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.ingredientBox}>
        {adjustedIngredients.map((ing, idx) => (
          <Text
            key={idx}
            style={styles.ingredientText}
          >
            {ing.quantity} {ing.unit} {ing.name}
          </Text>
        ))}
      </View>

      {/* Botón guardar favorito personalizado */}
      {hasCustom && (
        <TouchableOpacity style={styles.saveCustomBtn} onPress={handleSaveCustomFavorite}>
          <Ionicons name="heart" size={18} color="#fff" />
          <Text style={styles.saveCustomBtnText}>Guardar en favoritos "A tu gusto"</Text>
        </TouchableOpacity>
      )}

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="¡Bien hecho!"
        message="Tu receta fue modificada a tu gusto y la podés ver en tus favoritos."
      />

      {/* Steps */}
      <Text style={[styles.sectionTitle, { fontWeight: 'bold', color: '#333' }]}>Paso a paso</Text>
      {recipe.stepsList.map((step, idx) => (
        <View
          key={idx}
          style={styles.stepBox}
        >
          <Text style={styles.stepText}>
            {idx + 1}. {step.texto}
          </Text>
          {step.urls?.length ? (
            <Image
              source={{ uri: step.urls[0] }}
              style={styles.stepImage}
              contentFit="cover"
            />
          ) : null}
        </View>
      ))}

      {/* Button to open rating modal */}
      <TouchableOpacity
        style={styles.evalBtn}
        onPress={() => setShowRatingModal(true)}
      >
        <Text style={styles.evalBtnText}>
          Evaluar Receta
        </Text>
      </TouchableOpacity>

      {/* Verified comments */}
      <Text style={[styles.sectionTitle, { fontWeight: 'bold', color: '#333' }]}>Comentarios</Text>
      {verifiedComments.length ? (
        verifiedComments.map((rating, idx) => (
          <View
            key={rating.id ?? idx}
            style={styles.commentBox}
          >
            <View style={styles.commentHeader}>
              <Ionicons
                name="person-circle-outline"
                size={32}
                color="#025E45"
              />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={styles.commentUser}>
                  @{rating.user} - {formatDate(rating.createdAt)}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  <Ionicons
                    name="star"
                    size={16}
                    color="#FFD700"
                  />
                  <Text
                    style={styles.commentRating}
                  >
                    {rating.rate}
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color="#4CAF50"
                    />
                    <Text
                      style={styles.verifiedText}
                    >
                      Verificado
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <Text style={styles.commentText}>
              {rating.comment}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.noCommentsBox}>
          <Ionicons
            name="chatbubble-outline"
            size={48}
            color="#ccc"
          />
          <Text style={styles.noCommentsText}>
            No hay comentarios aún
          </Text>
        </View>
      )}

      <RecipeRatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        recipeTitle={recipe.title}
        onSubmit={() => {} }
      />

      {/* Modal para editar ingrediente */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Editar ingrediente</Text>
            <Text style={{ marginBottom: 8 }}>Ingrediente</Text>
            <View style={styles.dropdownBox}>
              {recipe?.ingredients.map((ing, idx) => (
                <Pressable
                  key={idx}
                  style={[styles.dropdownItem, selectedIngredientIdx === idx && { backgroundColor: '#e0e0e0' }]}
                  onPress={() => setSelectedIngredientIdx(idx)}
                >
                  <Text>{ing.name}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={{ marginTop: 12 }}>Cantidad</Text>
            <TextInput
              style={styles.input}
              value={editQuantity}
              onChangeText={setEditQuantity}
              placeholder="Cantidad"
              keyboardType="numeric"
            />
            <Text style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
              Ingresá la nueva cantidad del ingrediente seleccionado.
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                <Text style={{ color: '#fff' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleEditIngredient}>
                <Text style={{ color: '#fff' }}>Actualizar receta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  favoriteBtn: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
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
  portionBtn: { marginHorizontal: 2 },
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
  evalBtn: {
    backgroundColor: '#055B49',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 12,
    alignItems: 'center'
  },
  evalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  commentBox: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginHorizontal: 16,
    padding: 12,
    marginBottom: 16
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  commentUser: {
    fontWeight: '600',
    color: '#025E45'
  },
  commentRating: {
    marginLeft: 4,
    color: '#333',
    fontWeight: 'bold'
  },
  commentText: {
    color: '#333',
    fontSize: 15,
    marginTop: 2
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12
  },
  verifiedText: {
    marginLeft: 2,
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 12
  },
  noCommentsBox: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    marginHorizontal: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center'
  },
  noCommentsText: {
    color: '#999',
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center'
  },
  editBtn: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: 320,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  dropdownItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f6f6f6',
    marginRight: 6,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  cancelBtn: {
    backgroundColor: '#888',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  saveBtn: {
    backgroundColor: '#025E45',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  saveCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#025E45',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  saveCustomBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 15,
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  customizedTagRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  customizedText: {
    marginLeft: 4,
    color: '#025E45',
    fontWeight: 'bold',
    fontSize: 12,
  },
});