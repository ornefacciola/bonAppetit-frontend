import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SuccessModal from '../components/ui/SuccessModal';
import WarningModal from '../components/ui/WarningModal';
import { useMobileData } from '../contexts/MobileDataContext';

interface BorradorReceta {
  titulo: string;
  descripcion: string;
  categoria: string;
  porciones: string;
  ingredientes: any[];
  pasos: any[];
  fotoFinal: string | null;
}

export default function BorradoresScreen() {
  const [borradores, setBorradores] = useState<BorradorReceta[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicando, setPublicando] = useState<string | null>(null);
  const [userAlias, setUserAlias] = useState<string | null>(null);
  const { isWifi } = useMobileData();
  const router = useRouter();
  const [modalError, setModalError] = useState({ visible: false, mensaje: '' });
  const [modalExito, setModalExito] = useState(false);

  useEffect(() => {
    const getAliasAndLoad = async () => {
      const userInfoString = await AsyncStorage.getItem('userInfo');
      if (userInfoString) {
        const user = JSON.parse(userInfoString);
        setUserAlias(user.alias);
        await cargarBorradores(user.alias);
      } else {
        setUserAlias(null);
        setBorradores([]);
        setLoading(false);
      }
    };
    getAliasAndLoad();
  }, []);

  const cargarBorradores = async (alias: string) => {
    setLoading(true);
    const data = await AsyncStorage.getItem(`pendingRecipes_${alias}`);
    setBorradores(data ? JSON.parse(data) : []);
    setLoading(false);
  };

  const eliminarBorrador = async (titulo: string) => {
    if (!userAlias) return;
    const nuevos = borradores.filter(b => b.titulo !== titulo);
    setBorradores(nuevos);
    await AsyncStorage.setItem(`pendingRecipes_${userAlias}`, JSON.stringify(nuevos));
  };

  const intentarPublicar = async (receta: BorradorReceta) => {
    if (!isWifi) {
      setModalError({ visible: true, mensaje: 'Necesitás conexión WiFi para publicar la receta.' });
      return;
    }
    setPublicando(receta.titulo);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('title', receta.titulo);
      formData.append('description', receta.descripcion);
      formData.append('category', receta.categoria);
      formData.append('portions', receta.porciones);
      formData.append('ingredients', JSON.stringify(receta.ingredientes));
      formData.append('stepsList', JSON.stringify(receta.pasos));
      formData.append('aditionalMedia', JSON.stringify([]));
      formData.append('isVerified', 'false');
      if (receta.fotoFinal) {
        formData.append('image', {
          uri: receta.fotoFinal,
          type: 'image/jpeg',
          name: `foto_${Date.now()}.jpg`,
        } as any);
      }
      const res = await fetch('https://bon-appetit-production.up.railway.app/api/recipies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error('Error al enviar la receta');
      await eliminarBorrador(receta.titulo);
      setModalExito(true);
    } catch (e: any) {
      setModalError({ visible: true, mensaje: e.message || 'No se pudo publicar la receta.' });
    }
    setPublicando(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} onPress={() => router.back()} />
        <Text style={styles.title}>Borradores</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#025E45" style={{ marginTop: 32 }} />
      ) : borradores.length === 0 ? (
        <Text style={styles.empty}>No hay recetas en borradores.</Text>
      ) : (
        <ScrollView>
          {borradores.map((receta, idx) => (
            <View key={receta.titulo + idx} style={styles.card}>
              <Text style={styles.cardTitle}>{receta.titulo}</Text>
              <Text style={styles.cardDesc}>{receta.descripcion}</Text>
              <Text style={styles.cardCat}>Categoría: {receta.categoria}</Text>
              <Text style={styles.cardCat}>Porciones: {receta.porciones}</Text>
              <TouchableOpacity
                style={styles.publishBtn}
                onPress={() => intentarPublicar(receta)}
                disabled={publicando === receta.titulo}
              >
                <Text style={styles.publishBtnText}>
                  {publicando === receta.titulo ? 'Publicando...' : 'Intentar publicar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => eliminarBorrador(receta.titulo)}
                disabled={publicando === receta.titulo}
              >
                <Text style={styles.deleteBtnText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
      <WarningModal
        visible={modalError.visible}
        onClose={() => setModalError({ visible: false, mensaje: '' })}
        title="Error"
        message={modalError.mensaje}
      />
      <SuccessModal
        visible={modalExito}
        onClose={() => setModalExito(false)}
        title="¡Éxito!"
        message="Receta enviada. Está pendiente de aprobación y podés consultarla en Recetas pendientes de aprobación."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    paddingTop: 56,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    marginTop: 9,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  empty: {
    color: '#888',
    fontSize: 16,
    marginTop: 32,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 6,
    color: '#222',
  },
  cardDesc: {
    color: '#444',
    marginBottom: 6,
  },
  cardCat: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
  publishBtn: {
    backgroundColor: '#025E45',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  publishBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  deleteBtn: {
    backgroundColor: '#eee',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#D32F2F',
    fontWeight: 'bold',
    fontSize: 14,
  },
}); 