import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import React, { createContext, useContext } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { GlobalBottomBar } from '@/components/GlobalBottomBar';
import useColorScheme from '@/hooks/useColorScheme';
import { useUserRole } from '@/hooks/useUserRole';
import { Redirect } from 'expo-router';

import { useRouter, useSegments } from 'expo-router';
import GlobalConnectionModal from '../components/ui/GlobalConnectionModal';
import { ConnectionProvider } from '../contexts/ConnectionContext';
import { FavoriteProvider } from '../contexts/FavoriteContext';

// Contexto para exponer el handler de navegación seguro en la landing
const LandingNavContext = createContext<(navFn: () => void) => void>(() => {});
export const useLandingNav = () => useContext(LandingNavContext);

function ProtectedApp() {
  const { token, isLoading, logout } = useAuth();
  const userRole = useUserRole();
  const segments = useSegments();
  const router = useRouter();

  // Detectar si estamos en el flujo de carga de receta
  const inRecipeUpload =
    String(segments[0]) === 'cargar-receta' ||
    (String(segments[0]) === 'modals' && String(segments[1]) === 'cargar-receta');

  // Detectar si estamos en la pantalla inicial
  const isLanding = !segments[0] || String(segments[0]) === 'index';

  // Detectar si el usuario está logueado
  const isLoggedIn = !!token;
  // Unificar lógica: mostrar 'Cerrar' si no está logueado o está en la landing
  const isLandingOrNotLogged = !isLoggedIn || isLanding;

  // Estado local para ocultar el modal en la landing tras cerrar
  const [hideLandingModal, setHideLandingModal] = React.useState(false);

  // Lógica de visibilidad del modal
  const shouldShowModal =
    isLoggedIn && !isLanding && !inRecipeUpload
      ? true
      : isLandingOrNotLogged
        ? false
        : false;

  // Handler especial para cerrar el modal en landing o cuando no está logueado
  const handleLandingClose = () => {
    setHideLandingModal(true);
    if (!isLanding && !isLoggedIn) {
      router.replace('/');
    }
  };

  // Handler para navegación desde landing
  const handleLandingNav = (navFn: () => void) => {
    navFn();
  };

  // Ruta actual (primer segmento)
  const current = segments[0] || '';

  const isPublicRoute =
    String(current) === '' ||
    String(current) === 'index' ||
    String(current) === 'login' ||
    String(current) === 'forgotPasswordScreen';

  // Ocultar modal automáticamente al volver la conexión
  React.useEffect(() => {
    if (isLoggedIn) {
      setHideLandingModal(false);
    }
  }, [isLoggedIn]);

  if (isLoading || userRole === null) return null; // o Splash

  // Allow access if user has token OR is guest
  const isAuthenticated = token || userRole === 'guest';

  if (!isAuthenticated && !isPublicRoute) {
    return <Redirect href="/" />;
  }

  return (
    <LandingNavContext.Provider value={handleLandingNav}>
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
    </LandingNavContext.Provider>
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
    <ConnectionProvider>
      <FavoriteProvider>
        <AuthProvider>
          <ProtectedApp />
          <GlobalConnectionModal />
        </AuthProvider>
      </FavoriteProvider>
    </ConnectionProvider>
  );
}
