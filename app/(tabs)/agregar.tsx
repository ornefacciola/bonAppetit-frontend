// app/(tabs)/agregar.tsx
import { ProtectedPage } from '@/components/ProtectedPage';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AppLogo } from '@/components/ui/AppLogo';
import NoInternetModal from '@/components/ui/NoInternetModal';
import { useMobileData } from '@/contexts/MobileDataContext';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const router = useRouter();

export default function Agregar() {
  const [searchText, setSearchText] = useState('');
  const { isConnected, allowMobileData, setAllowMobileData } = useMobileData();
  const [hideModal, setHideModal] = useState(false);

  // Mostrar modal si no hay conexión y no se permite datos móviles
  const shouldShowModal = isConnected === false && !allowMobileData && !hideModal;

  return (
    <ProtectedPage pageName="cargar-receta">
      <>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
        <ThemedView style={[styles.container, { backgroundColor: '#F6F6F6' }]}>
          {/* Logo */}
          <Pressable onPress={() => router.push('/(tabs)/home')}>
            <AppLogo width={150} height={72} style={styles.logo} />
          </Pressable>

      
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
               ¡Compartir tus recetas!
            </ThemedText>
            <ThemedText type="default" style={styles.placeholderSubText}>
              Tocá "Cargar Receta" para agregar una nueva.  
            </ThemedText>
             <ThemedText type="default" style={styles.placeholderSubText}>
            Tus recetas están en el perfil.
          </ThemedText>
          </View>
        </ThemedView>
        <NoInternetModal
          visible={shouldShowModal}
          onContinueWithMobile={() => setAllowMobileData(true)}
          onClose={() => setHideModal(true)}
          isLanding={true}
        />
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
    marginTop: 80,    
    marginBottom: 24,
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
    textAlign: 'center',

  },
});
