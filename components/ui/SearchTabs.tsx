import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  selected: 'receta' | 'ingredientes' | 'usuarios';
  onSelect: (val: 'receta' | 'ingredientes' | 'usuarios') => void;
}

export const SearchTabs: React.FC<Props> = ({ selected, onSelect }) => {
  return (
    <View style={styles.container}>
      {(['receta', 'ingredientes', 'usuarios'] as const).map((item) => (
        <TouchableOpacity
          key={item}
          style={[styles.tabButton, selected === item && styles.tabSelected]}
          onPress={() => onSelect(item)}
        >
          <Text style={selected === item ? styles.tabTextActive : styles.tabText}>
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F2',
  },
  tabSelected: {
    backgroundColor: '#025E45',
  },
  tabText: {
    color: '#555',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
