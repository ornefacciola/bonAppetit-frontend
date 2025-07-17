import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ErrorModal from '../components/ui/ErrorModal';
import SuccessModal from '../components/ui/SuccessModal';
import { useConnection } from '../contexts/ConnectionContext';

interface BorradorReceta {
  titulo: string;
  descripcion: string;
  categoria: string;
  porciones: string;
  ingredientes: any[];
  pasos: any[];
  fotoFinal: string | null;
}

// ---- NUEVO: subir imagen a Cloudinary ----
const uploadImageToCloudinary = async (uri: string): Promise<string> => {
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1] : 'jpg';
  const type = `image/${ext}`;
  formData.append('file', { uri, name: filename, type } as any);
  formData.append('upload_preset', 'ml_default');
  const res = await fetch('https://api.cloudinary.com/v1_1/drvtr4kxz/image/upload', {
    method: 'POST',
    body: formData,
  });
  const result = await res.json();
  if (!result.secure_url) throw new Error('No se pudo subir la imagen');
  return result.secure_url;
};

export default function BorradoresScreen() {
  const [borradores, setBorradores] = useState<BorradorReceta[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicando, setPublicando] = useState<string | null>(null);
  const [userAlias, setUserAlias] = useState<string | null>(null);
  const router = useRouter();
  const [modalError, setModalError] = useState({ visible: false, mensaje: '' });
  const [modalExito, setModalExito] = useState(false);
  const { isConnected } = useConnection();

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

  // -------- PUBLICAR RECETA DE BORRADOR (ahora igual que el wizard) -------
  const intentarPublicar = async (receta: BorradorReceta & { recetaId?: string }) => {
    if (!isConnected) {
      setModalError({ visible: true, mensaje: 'Necesitás conexión a internet para publicar la receta.' });
      return;
    }
    setPublicando(receta.titulo);
    try {
      const token = await AsyncStorage.getItem('authToken');

      // 1. Subir foto final si es local (startsWith file)
      let imageUrl = null;
      if (receta.fotoFinal && receta.fotoFinal.startsWith('file')) {
        imageUrl = await uploadImageToCloudinary(receta.fotoFinal);
      } else {
        imageUrl = receta.fotoFinal || null;
      }

      // 2. Subir imágenes de pasos si son locales
      const pasosConImagenes = await Promise.all(
        (receta.pasos || []).map(async (p) => {
          let url = p.media;
          if (p.media && typeof p.media === 'string' && p.media.startsWith('file')) {
            url = await uploadImageToCloudinary(p.media);
          }
          return {
            ...p,
            urls: url ? [url] : [],
            media: undefined, // limpia media para no mandar local
          };
        })
      );

      // 3. Preparar body igual que el flujo normal
      const body = {
        title: receta.titulo,
        description: receta.descripcion,
        category: receta.categoria,
        portions: receta.porciones,
        ingredients: receta.ingredientes,
        stepsList: pasosConImagenes,
        aditionalMedia: [],
        image_url: imageUrl,
        isVerificated: false,
      };

      let res;
      if (receta.recetaId) {
        // Si el borrador tiene recetaId, hacer PUT
        res = await fetch(`https://bon-appetit-production.up.railway.app/api/recipies/${receta.recetaId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      } else {
        // Si no, hacer POST
        res = await fetch('https://bon-appetit-production.up.railway.app/api/recipies', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      }
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
      <ErrorModal
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
