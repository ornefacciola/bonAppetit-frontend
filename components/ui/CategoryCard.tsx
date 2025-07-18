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
    width: 113, // Adjust width as needed
    height:113,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow:'hidden',
    paddingVertical: 10,
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
    width: 68,
    height: 68,
    borderRadius: 40,
    marginBottom: 2
  },
  title: {
    fontSize: 13,
    fontFamily:'Montserrat-Medium',
    color: '#333', 
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