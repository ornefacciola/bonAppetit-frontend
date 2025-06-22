import { AuthProvider } from '@/contexts/AuthContext';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Montserrat: require('../assets/fonts/MontserratRegular400.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
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

      </Stack>
    </AuthProvider>
  );
}
