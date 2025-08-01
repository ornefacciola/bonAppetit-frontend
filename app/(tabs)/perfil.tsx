import { ProtectedPage } from '@/components/ProtectedPage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // íconos
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface UserInfo {
  _id: string;
  name: string;
  email: string;
  alias: string;
}

export default function PerfilScreen() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userInfoString = await AsyncStorage.getItem('userInfo');
        if (userInfoString) {
          const user = JSON.parse(userInfoString);
          setUserInfo(user);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, []);

  if (loading) {
    return (
      <ProtectedPage pageName="perfil">
        <View style={[styles.container, { backgroundColor: '#F6F6F6', justifyContent: 'center', alignItems: 'center' }]}>
          <Text>Cargando perfil...</Text>
        </View>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage pageName="perfil">
    <View style={[styles.container, { backgroundColor: '#F6F6F6' }]}> 
      {/* Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarIcon}>
          <Ionicons name="person" size={32} color="#fff" />
        </View>
        <View>
          <Text style={styles.name}>
            Bon Appetit {userInfo?.name?.split(' ')[0] || 'Usuario'}!
          </Text>
          <Text style={styles.username}>@{userInfo?.alias || 'usuario'}</Text>
        </View>
      </View>
      {/* Sección Perfil */}
      <Text style={styles.sectionTitle}>Perfil</Text>

      <View style={styles.optionsContainer}>
        {/* Opción 1: Publicadas */}
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => router.push('/recetas-publicadas')}
        >
          <View style={styles.optionLeft}>
            <MaterialCommunityIcons name="chef-hat" size={20} color="black" />
            <Text style={styles.optionText}>Mis recetas publicadas</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="black" />
        </TouchableOpacity>

        {/* Línea */}
        <View style={styles.divider} />

        {/* Opción 2: Pendientes */}
        <TouchableOpacity style={styles.optionRow}
          onPress={() => router.push('/recetas-pendientes')}>
          <View style={styles.optionLeft}>
            <MaterialCommunityIcons name="clipboard-clock-outline" size={20} color="black" />
            <Text style={styles.optionText}>Recetas pendientes de aprobación</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="black" />
        </TouchableOpacity>

        {/* Línea */}
        <View style={styles.divider} />

        {/* Opción 3: Borradores */}
        <TouchableOpacity style={styles.optionRow}
          onPress={() => router.push('/borradores')}>
          <View style={styles.optionLeft}>
            <Ionicons name="document-outline" size={20} color="black" />
            <Text style={styles.optionText}>Borradores</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="black" />
        </TouchableOpacity>

        {/* Línea */}
        <View style={styles.divider} />

        {/* Opción 3: Cerrar sesión */}
          <TouchableOpacity style={styles.optionRow} onPress={() => setShowLogoutModal(true)}>
          <View style={styles.optionLeft}>
            <Ionicons name="exit-outline" size={20} color="black" />
            <Text style={styles.optionText}>Cerrar sesión</Text>
          </View>
        </TouchableOpacity>
      </View>
      {/* Modal de confirmación de logout */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', width: 300 }}>
            <Ionicons name="log-out-outline" size={48} color="#025E45" style={{ marginBottom: 12 }} />
            <Text style={{ fontSize: 18, color: 'black', marginBottom: 12, textAlign: 'center' }}>
              ¿Estás seguro que deseas cerrar sesión?
            </Text>
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity
                style={{ backgroundColor: '#ccc', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20, marginRight: 12 }}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={{ color: '#333', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#025E45', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 }}
                onPress={() => {
                  setShowLogoutModal(false);
                  router.replace('/');
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
    </ProtectedPage>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
    paddingHorizontal: 24,
    backgroundColor: '#F6F6F6',
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
    height: 1.2,
    backgroundColor: '#E0E0E0',
  },
});
