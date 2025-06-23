import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { IconSymbol } from './IconSymbol';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "Buscar recetas, usuarios e ingredientes",
  value,
  onChangeText,
  onFocus
}) => {
  return (
    <View style={styles.searchContainer}>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#9E9E9E"
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
      />
      <IconSymbol name="magnifyingglass" size={20} color="#9E9E9E" />
    </View>
  );
};

const styles = StyleSheet.create({
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
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
}); 