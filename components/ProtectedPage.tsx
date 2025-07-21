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
          <Ionicons name="close" size={24} color="#025E45" />
        </TouchableOpacity>
        <AppLogo width={100} height={29} style={{ marginBottom: 20 }} />
        <Ionicons name={getIcon()} size={38} color="#b0b0b0" style={{ marginBottom: 12 }} />
        <Text style={styles.guestTitle}>{getMessage()}</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
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
    fontSize: 15,
    marginBottom: 18,
    color: '#222',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  loginButton: {
    backgroundColor: '#025E45',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  closeButton: {
    position: 'absolute',
    top: 28,
    right: 18,
    zIndex: 10,
  },
}); 