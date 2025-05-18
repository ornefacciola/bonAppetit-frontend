import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function SorryScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      {/* Logo */}
      <Image
        source={require('@/assets/images/bon-appetit-logo.svg')}
        style={styles.logo}
        contentFit="contain"
      />

      {/* Error message */}
      <ThemedText type="title" style={styles.title}>
        Sorry to interrupt,
      </ThemedText>
      <ThemedText type="default" style={styles.message}>
        you will need to log in for now.
      </ThemedText>

      {/* Link back to index */}
      <Pressable onPress={() => router.push('/')}>
        <ThemedText type="link" style={styles.backLink}>
          Volver al inicio
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 100,
    height: 60,
    alignSelf: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 12,
    color: 'black'
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: 'black'
  },
  backLink: {
    fontSize: 14,
    textDecorationLine: 'underline',
    textAlign: 'center',
    color: '#055B49',
  },
});
