import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import 'react-native-reanimated';

import { GlobalBottomBar } from '@/components/GlobalBottomBar';
import useColorScheme from '@/hooks/useColorScheme';
import { useUserRole } from '@/hooks/useUserRole';
import { Redirect } from 'expo-router';

import { useSegments } from 'expo-router';
import { FavoriteProvider } from '../contexts/FavoriteContext';

function ProtectedApp() {
  const { token, isLoading } = useAuth();
  const userRole = useUserRole();
  const segments = useSegments();

  // Ruta actual (primer segmento)
  const current = segments[0] || '';

  const isPublicRoute = current === '' || current === 'index' || current === 'login' || current === 'forgotPasswordScreen';

  if (isLoading || userRole === null) return null; // o Splash

  // Allow access if user has token OR is guest
  const isAuthenticated = token || userRole === 'guest';

  if (!isAuthenticated && !isPublicRoute) {
    return <Redirect href="/" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sorry" />
        <Stack.Screen name="search" />
        <Stack.Screen name="recetas-publicadas" />
        <Stack.Screen name="recetas-pendientes" />
        <Stack.Screen name="receta/[id]" />
        <Stack.Screen
          name="modals/cargar-receta"
          options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="searchByCategory" />
        <Stack.Screen name="forgotPasswordScreen" />
      </Stack>
      <GlobalBottomBar />
    </View>
  );
}
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Montserrat: require('../assets/fonts/MontserratRegular400.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <FavoriteProvider>
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
    </FavoriteProvider>
  );
}
