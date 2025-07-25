import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StatusBar, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AppLogo } from '@/components/ui/AppLogo';
import { useLandingNav } from './_layout';

interface Props {
  navigation: any;
}


export default function PrincipalScreen({ navigation }: Props) {
  const router = useRouter();
  const { login } = useAuth();
  const handleLandingNav = useLandingNav();

  const handleGuestLogin = async () => {
    // Limpiar cualquier token previo y setear modo guest
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userInfo');
    await AsyncStorage.setItem('userRole', 'guest');
    router.replace('/(tabs)/home');
  };

  return (
    <>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <ThemedView style={styles.container}>
        <AppLogo width={240} height={72} style={styles.logo} />

        <ThemedText type="subtitle" style={styles.tagline}>
          Tu mejor recetario online
        </ThemedText>

        <Pressable
          style={styles.button}
          onPress={() => handleLandingNav(() => router.push('/login'))}
        >
          <ThemedText type="defaultSemiBold" style={styles.buttonText}>
            Iniciar sesión
          </ThemedText>
        </Pressable>

        <Pressable onPress={() => handleLandingNav(handleGuestLogin)}>
          <ThemedText type="link" style={styles.guestLink}>
            {'Soy visitante, quiero\ningresar sin iniciar sesión'}
          </ThemedText>
        </Pressable>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 240,
    height: 72,
    marginBottom: 0,
  },
  tagline: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 60,
    textAlign: 'center',
  },
  button: {
    width: '50%',
    backgroundColor: '#055B49',
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  guestLink: {
    fontSize: 14,
    textDecorationLine: 'underline',
    color: '#616161',
    marginTop: 0,
    textAlign: 'center'
  },
});
