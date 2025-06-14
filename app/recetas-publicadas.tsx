import RecipeCard from '@/components/receta/RecipeCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PerfilRecetasPublicadas() {
  const router = useRouter();

  const recetas = [
    {
      id: '1',
      title: 'Hojaldre de Frutos Rojos',
      category: 'Postres',
      author: 'paulinacocina',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
      rating: 4.2,
    },
    {
      id: '2',
      title: 'Pistacho, Frutos Rojos y Ddl',
      category: 'Postres',
      author: 'paulinacocina',
      imageUrl: 'https://images.unsplash.com/photo-1551218808-94e220e084d2',
      rating: 4.2,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} onPress={() => router.back()} />
        <Text style={styles.title}>Mis recetas publicadas</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {recetas.map((receta) => (
          <RecipeCard
            key={receta.id}
            {...receta}
            onPress={() => {}}
            onToggleFavorite={() => {}}
            isFavorite={false}
            variant="compact"
          />
        ))}
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
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scroll: {
    paddingBottom: 32,
  },
});
