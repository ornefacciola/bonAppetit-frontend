// app/comentarios-pendientes.tsx
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

interface ComentarioPendiente {
  recetaId: string;
  recetaTitulo: string;
  comentario: string;
  fecha: number;
}

export default function ComentariosPendientes() {
  const router = useRouter();
  const [pendientes, setPendientes] = useState<ComentarioPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComentarios = async () => {
      try {
        const userInfoString = await AsyncStorage.getItem('userInfo');
        if (!userInfoString) {
          setError('No se pudo obtener el alias del usuario');
          setLoading(false);
          return;
        }
        const userInfo = JSON.parse(userInfoString);
        const userId = userInfo._id || userInfo.id;
        const miAlias = userInfo.alias;

        // 1. Obtener info del usuario
        const userResp = await fetch(`https://bon-appetit-production.up.railway.app/api/users/${userId}`);
        const userData = await userResp.json();
        if (userData.status !== 'success') {
          setError('No se pudo obtener la información del usuario');
          setLoading(false);
          return;
        }
        const favouriteRecipes = userData.user.favouriteRecipes;

        // 2. Buscar comentarios pendientes en recetas favoritas
        const pendientes: ComentarioPendiente[] = [];
        for (const recetaId of favouriteRecipes) {
          try {
            const recetaResp = await fetch(`https://bon-appetit-production.up.railway.app/api/recipies/${recetaId}`);
            const recetaData = await recetaResp.json();
            if (recetaData.status !== 'success') continue;
            const receta = Array.isArray(recetaData.payload) ? recetaData.payload[0] : recetaData.payload;

            if (Array.isArray(receta.rating)) {
              receta.rating.forEach((r: any) => {
                if (
                  r.user?.toLowerCase() === miAlias?.toLowerCase() &&
                  r.comment &&
                  r.isCommentVerified === false
                ) {
                  pendientes.push({
                    recetaId: receta._id,
                    recetaTitulo: receta.title,
                    comentario: r.comment,
                    fecha: r.createdAt || Date.now(),
                  });
                }
              });
            }
          } catch (e) {
            continue;
          }
        }
        setPendientes(pendientes);
        setLoading(false);
      } catch (error) {
        setError('Error al cargar los comentarios');
        setLoading(false);
      }
    };

    fetchComentarios();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="arrow-back" size={24} onPress={() => router.back()} />
          <Text style={styles.title}>Comentarios pendientes de aprobación</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#025E45" />
          <Text style={styles.loadingText}>Cargando comentarios...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="arrow-back" size={24} onPress={() => router.back()} />
          <Text style={styles.title}>Comentarios pendientes de aprobación</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} onPress={() => router.back()} />
        <Text style={styles.title}>Comentarios pendientes de aprobación</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {pendientes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-ellipses-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No tienes comentarios pendientes de aprobación</Text>
          </View>
        ) : (
          pendientes.map((p, i) => (
            <View key={i} style={styles.card}>
              <Text style={styles.recetaTitulo}>{p.recetaTitulo}</Text>
              <Text style={styles.comentario}>{p.comentario}</Text>
              <Text style={styles.fecha}>
                {new Date(p.fecha).toLocaleDateString()} {new Date(p.fecha).toLocaleTimeString()}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 16,
    backgroundColor: '#F6F6F6',
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
  scroll: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  recetaTitulo: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 6,
  },
  comentario: {
    fontSize: 15,
    color: '#222',
    marginBottom: 8,
  },
  fecha: {
    fontSize: 12,
    color: '#666',
  },
});
