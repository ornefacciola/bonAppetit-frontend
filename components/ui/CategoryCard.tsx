import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';

interface CategoryCardProps {
  title: string;
  imageUrl: string;
  onPress: () => void;
}

export const CategoryCard = ({ title, imageUrl, onPress }: CategoryCardProps) => {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={{ uri: imageUrl }} style={styles.image} contentFit="contain" />
      <ThemedText type="defaultSemiBold" style={styles.title}>
        {title}
      </ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginRight: 12,
    width: 100, // Adjust width as needed
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0', // Placeholder background
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    color: '#424242',
    textAlign: 'center',
  },
}); 