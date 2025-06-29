import { useUserRole } from '@/hooks/useUserRole';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

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

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Text style={{ fontSize: 18, marginBottom: 16, textAlign: 'center' }}>
          {getMessage()}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#025E45',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 8,
          }}
          onPress={() => router.replace('/')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Ir a Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
} 