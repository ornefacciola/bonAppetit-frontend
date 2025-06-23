import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface CategoryCardProps {
  title: string;
  imageUrl: string;
  onPress: () => void;
  selected?: boolean;
}

export const CategoryCard = ({ title, imageUrl, onPress, selected }: CategoryCardProps) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        selected && styles.selectedContainer
      ]}
      onPress={onPress}
    >
      <Image source={{ uri: imageUrl }} style={styles.image} contentFit="contain" />
      <ThemedText type="defaultSemiBold" style={styles.title}>
        {title}
      </ThemedText>
      {selected && (
        <View style={styles.checkmarkBox}>
          <Ionicons name="checkmark" size={16} color="#fff" />
        </View>
      )}
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
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedContainer: {
    borderColor: '#222',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F6F6F6', // Placeholder background
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    color: '#424242',
    textAlign: 'center',
  },
  checkmarkBox: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: '#222',
    borderWidth: 2,
    borderColor: '#fff',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 