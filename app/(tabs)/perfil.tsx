import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // íconos
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PerfilScreen() {
  const nombre = 'Paulina';
  const usuario = 'paulinacocina';

  return (
    <><View style={styles.container}>
          {/* Header */}
          <View style={styles.profileHeader}>
              <View style={styles.avatarIcon}>
                  <Ionicons name="person" size={32} color="#fff" />
              </View>
              <View>
                  <Text style={styles.name}>Bon Appetit {nombre}!</Text>
                  <Text style={styles.username}>@{usuario}</Text>
              </View>
          </View>

          {/* Sección Perfil */}
          <Text style={styles.sectionTitle}>Perfil</Text>

          <View style={styles.optionsContainer}>
              {/* Opción 1: Publicadas */}
              <TouchableOpacity style={styles.optionRow} >
                  <View style={styles.optionLeft}>
                      <MaterialCommunityIcons name="chef-hat" size={20} color="black" />
                      <Text style={styles.optionText}>Mis recetas publicadas</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="black" />
              </TouchableOpacity>

              {/* Línea */}
              <View style={styles.divider} />

              {/* Opción 2: Pendientes */}
              <TouchableOpacity style={styles.optionRow}>
                  <View style={styles.optionLeft}>
                      <MaterialCommunityIcons name="clipboard-clock-outline" size={20} color="black" />
                      <Text style={styles.optionText}>Recetas pendientes de aprobación</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="black" />
              </TouchableOpacity>
          </View>
      </View><View style={styles.logoutWrapper}>
              <TouchableOpacity onPress={() => router.replace('/login')} style={styles.logoutButton}>
                  <Ionicons name="exit-outline" size={22} color="black" style={{ marginRight: 8 }} />
                  <Text style={styles.logoutText}>Cerrar sesión</Text>
              </TouchableOpacity>
          </View></>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
    paddingHorizontal: 24,
    backgroundColor: 'white',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#025E45',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  username: {
    color: '#6B6B6B',
    textDecorationLine: 'underline',
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 16,
    color: '#025E45',
  },
  optionsContainer: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
logoutWrapper: {
  paddingHorizontal: 24,
  paddingTop: 16,
  paddingBottom: 32, // espacio antes del tab bar
  backgroundColor: '#fff',
},

logoutButton: {
  flexDirection: 'row',
  alignItems: 'center',
},

logoutText: {
  fontSize: 16,
  fontWeight: '600',
},


});
