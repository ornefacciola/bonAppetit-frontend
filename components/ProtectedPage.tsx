import { useUserRole } from '@/hooks/useUserRole';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppLogo } from './ui/AppLogo';

interface ProtectedPageProps {
  children: React.ReactNode;
  pageName?: string;
}

export function ProtectedPage({ children, pageName }: ProtectedPageProps) {
  const userRole = useUserRole();
  const router = useRouter();

  if (userRole === null) return null; // o un loader

  if (userRole !== 'user') {
    const getMessage = () => {
      switch (pageName) {
        case 'favoritos':
          return 'Debes iniciar sesión para ver favoritos.';
        case 'cargar-receta':
          return 'Debes iniciar sesión para cargar una receta.';
        case 'perfil':
          return 'Debes iniciar sesión para ver tu perfil.';
        default:
          return 'Debes iniciar sesión para acceder a esta página.';
      }
    };

    const getIcon = () => {
      switch (pageName) {
        case 'cargar-receta':
          return 'add-circle-outline';
        case 'perfil':
          return 'person-circle-outline';
        default:
          return 'lock-closed-outline';
      }
    }

    return (
      <View style={styles.guestContainer}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Ionicons name="close" size={32} color="#025E45" />
        </TouchableOpacity>
        <AppLogo width={140} height={41} style={{ marginBottom: 32 }} />
        <Ionicons name={getIcon()} size={64} color="#ccc" />
        <Text style={styles.guestTitle}>{getMessage()}</Text>
        <TouchableOpacity
          style={[styles.loginButton, { backgroundColor: '#025E45', borderWidth: 0, marginTop: 32, paddingVertical: 12, width: 180 }]}
          onPress={() => router.replace('/login')}
        >
          <Text style={[styles.loginButtonText, { color: '#fff', fontSize: 18 }]}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 20,
  },
  guestTitle: {
    fontSize: 20,
    marginBottom: 24,
    color: 'black',
    textAlign: 'center',
    marginTop: 16,
  },
  loginButton: {
    backgroundColor: '#025E45',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 24,
    zIndex: 10,
  },
}); 