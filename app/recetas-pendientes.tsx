import RecipeCard from '@/components/receta/RecipeCard';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function RecetasPendientes() {
  const router = useRouter();

  const recetasPendientes = [
    {
      id: '1',
      title: 'Hojaldre de Frutos Rojos 2',
      category: 'Postres',
      author: 'paulinacocina',
      imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
      rating: 4.2,
    },
    {
      id: '2',
      title: 'Yogur griego con frutos rojos',
      category: 'Desayunos',
      author: 'paulinacocina',
      imageUrl: 'https://images.unsplash.com/photo-1613145993093-d5dc948f4a61',
      rating: 4.2,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} onPress={() => router.back()} />
        <Text style={styles.title}>Pendientes de aprobación</Text>
      </View>

      <Text style={styles.subsection}>Recetas:</Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        {recetasPendientes.map((receta) => (
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
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subsection: {
    fontSize: 16,
    fontWeight: '600',
    color: '#025E45',
    marginBottom: 12,
  },
  scroll: {
    paddingBottom: 100,
  },
});
