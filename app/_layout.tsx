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
    <Stack
      screenOptions={{
        headerShown: false,  
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sorry" />
      <Stack.Screen name="recetas-publicadas" />
      <Stack.Screen name="recetas-pendientes" />
      <Stack.Screen
        name="modals/cargar-receta"
        options={{ presentation: 'modal' }}
      />

    </Stack>
  );
}
