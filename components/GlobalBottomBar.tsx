import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function GlobalBottomBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = useAuth();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const ACTIVE_COLOR = isDark ? '#fff' : '#055B49';
  const INACTIVE_COLOR = isDark ? '#fff' : '#888';

  // Only show if user is authenticated
  if (!token) return null;

  // Pages where we don't want to show the bottom bar
  const hiddenPages = [
    '/login',
    '/sorry',
    '/forgotPasswordScreen',
  ];
  if (hiddenPages.includes(pathname)) {
    return null;
  }

  const publicPages = [
    '/login',
    '/forgotPasswordScreen',
    '/register',
    '/',
    '/index',
  ];
  if (!token || publicPages.includes(pathname)) {
    return null;
  }

  // Helper to match tab routes
  const isActive = (route: string) => {
    if (route === 'home') {
      return (
        pathname === '/(tabs)/home' ||
        pathname === '/' ||
        pathname.endsWith('/home') ||
        pathname === '/index'
      );
    }
    return pathname.endsWith(`/${route}`);
  };

  const handleTabPress = (route: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/(tabs)/${route}`);
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'ios' && (
        <BlurView
          tint="systemChromeMaterial"
          intensity={100}
          style={StyleSheet.absoluteFill}
        />
      )}
      <TouchableOpacity style={styles.tab} onPress={() => handleTabPress('home')}>
        <Ionicons
          name={isActive('home') ? 'home' : 'home-outline'}
          size={isActive('home') ? 22 : 18}
          color={isActive('home') ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
        <Text style={[styles.tabLabel, isActive('home') && styles.tabLabelActive, { color: isActive('home') ? ACTIVE_COLOR : INACTIVE_COLOR }]}>Inicio</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} onPress={() => handleTabPress('agregar')}>
        <Ionicons
          name={isActive('agregar') ? 'add-circle' : 'add-circle-outline'}
          size={isActive('agregar') ? 22 : 18}
          color={isActive('agregar') ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
        <Text style={[styles.tabLabel, isActive('agregar') && styles.tabLabelActive, { color: isActive('agregar') ? ACTIVE_COLOR : INACTIVE_COLOR }]}>Agregar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} onPress={() => handleTabPress('favoritos')}>
        <Ionicons
          name={isActive('favoritos') ? 'heart' : 'heart-outline'}
          size={isActive('favoritos') ? 22 : 18}
          color={isActive('favoritos') ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
        <Text style={[styles.tabLabel, isActive('favoritos') && styles.tabLabelActive, { color: isActive('favoritos') ? ACTIVE_COLOR : INACTIVE_COLOR }]}>Favoritos</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.tab} onPress={() => handleTabPress('perfil')}>
        <Ionicons
          name={isActive('perfil') ? 'person' : 'person-outline'}
          size={isActive('perfil') ? 22 : 18}
          color={isActive('perfil') ? ACTIVE_COLOR : INACTIVE_COLOR}
        />
        <Text style={[styles.tabLabel, isActive('perfil') && styles.tabLabelActive, { color: isActive('perfil') ? ACTIVE_COLOR : INACTIVE_COLOR }]}>Perfil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    minHeight: 52,
    maxHeight: 60,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 9,
    marginTop: 1,
    fontWeight: '400',
  },
  tabLabelActive: {
    fontWeight: 'bold',
  },
}); 