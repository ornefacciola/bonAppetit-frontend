// app/(tabs)/agregar.tsx
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
const router = useRouter();

import React from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Agregar() {
  return (
    <>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <ThemedView style={styles.container}>
        {/* Logo */}
        <Image
          source={require('@/assets/images/bon-appetit-logo.svg')}
          style={styles.logo}
          contentFit="contain"
        />

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar recetas, usuarios e ingredientes"
            placeholderTextColor="#9E9E9E"
          />
          <IconSymbol name="magnifyingglass" size={20} color="#9E9E9E" />
        </View>

        {/* Botón */}
        <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/modals/cargar-receta')}
        >
        <Text style={styles.buttonText}>Cargar Receta</Text>
        </TouchableOpacity>

        {/* Placeholder */}
        <View style={styles.placeholderContainer}>
            <FontAwesome5 name="utensils" size={64} color="#C0C0C0" style={styles.placeholderIcon} />
          <ThemedText type="defaultSemiBold" style={styles.placeholderText}>
            Todavía no cargaste ninguna receta
          </ThemedText>
          <ThemedText type="default" style={styles.placeholderSubText}>
            Clickea cargar receta para comenzar
          </ThemedText>
        </View>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  logo: {
    width: 150,
    height: 72,
    alignSelf: 'center',
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 32,
  },
  searchInput: {
    flex: 1,
    marginRight: 8,
  },
  button: {
    backgroundColor: '#025E45',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignSelf: 'center',
    marginBottom: 40,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  placeholderContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  placeholderIcon: {
  marginBottom: 24, // espacio entre el ícono y el texto
},
  placeholderText: {
    fontSize: 16,
    color: '#333',
    marginTop: 20,
  },
  placeholderSubText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginTop: 4,
  },
});
