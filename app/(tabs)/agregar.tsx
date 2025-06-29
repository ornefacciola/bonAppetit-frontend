// app/(tabs)/agregar.tsx
import { ProtectedPage } from '@/components/ProtectedPage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SearchBar } from '@/components/ui/SearchBar';
import { FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const router = useRouter();

export default function Agregar() {
  const [searchText, setSearchText] = useState('');

  return (
    <ProtectedPage pageName="cargar-receta">
      <>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
        <ThemedView style={[styles.container, { backgroundColor: '#F6F6F6' }]}>
          {/* Logo */}
          <Image
            source={require('@/assets/images/bon-appetit-logo.svg')}
            style={styles.logo}
            contentFit="contain"
          />

          <SearchBar 
            value={searchText}
            onChangeText={setSearchText}
          />

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
    </ProtectedPage>
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
