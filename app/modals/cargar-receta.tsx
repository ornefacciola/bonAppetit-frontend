import ErrorModal from '@/components/ui/ErrorModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal, Platform, ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import PublishRecipeNoWifiModal from '../../components/ui/PublishRecipeNoWifiModal';
import SuccessModal from '../../components/ui/SuccessModal';
import WarningModal from '../../components/ui/WarningModal';
import { useConnection } from '../../contexts/ConnectionContext';

// --- Parseadores robustos ---
const parseIngredientes = (arr: any[] = []) => {
  if (!Array.isArray(arr) || arr.length === 0)
    return [{ nombre: '', cantidad: '', unidad: '' }];
  return arr.map((i: any) => ({
    nombre: i.nombre || i.name || i.ingredient || '',
    cantidad:
      i.cantidad !== undefined
        ? String(i.cantidad)
        : i.quantity !== undefined
          ? String(i.quantity)
          : '',
    unidad: i.unidad || i.unit || i.medida || '',
  }));
};

const parsePasos = (arr: any[] = []) => {
  if (!Array.isArray(arr) || arr.length === 0)
    return [{ descripcion: '', media: [] as string[] }];
  return arr.map((p: any) => ({
    descripcion: p.descripcion || p.description || p.texto || '',
    media:
      (p.urls && Array.isArray(p.urls) ? p.urls : p.media ? [p.media] : p.image ? [p.image] : [])
  }));
};

// Cambiar la sintaxis de MediaType para que funcione correctamente
// En la selección de media para pasos:
// Mejorar la función uploadMediaToCloudinary con timeout más largo para videos
const uploadMediaToCloudinary = async (uri: string): Promise<string> => {
  console.log('=== INICIANDO SUBIDA A CLOUDINARY ===');
  console.log('URI:', uri);
  
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'media';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1].toLowerCase() : '';
  let type = '';
  let endpoint = '';
  let isVideo = false;

  if (["mp4", "mov", "avi", "webm", "mkv"].includes(ext)) {
    type = `video/${ext === 'mp4' ? 'mp4' : 'quicktime'}`;
    endpoint = 'https://api.cloudinary.com/v1_1/drvtr4kxz/video/upload';
    isVideo = true;
    console.log('Detectado video, usando endpoint de video con timeout extendido');
  } else {
    type = `image/${ext || 'jpg'}`;
    endpoint = 'https://api.cloudinary.com/v1_1/drvtr4kxz/image/upload';
    console.log('Detectada imagen, usando endpoint de imagen');
  }

  console.log('Endpoint:', endpoint);
  console.log('Tipo de archivo:', type);
  console.log('Nombre de archivo:', filename);
  console.log('Es video:', isVideo);

  let fileData: any;
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    fileData = blob;
  } else {
    fileData = {
      uri,
      name: filename,
      type,
    } as any;
  }

  formData.append('file', fileData);
  formData.append('upload_preset', 'ml_default');

  console.log('FormData preparado, enviando a Cloudinary...');
  console.log('Upload preset:', 'ml_default');
  
  // Timeout más largo para videos
  const timeout = isVideo ? 60000 : 30000; // 60 segundos para videos, 30 para imágenes
  console.log('Timeout configurado:', timeout + 'ms');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('Respuesta de Cloudinary - Status:', res.status);
    console.log('Respuesta de Cloudinary - OK:', res.ok);
    
    const result = await res.json();
    console.log('Respuesta completa de Cloudinary:', JSON.stringify(result, null, 2));
    
    if (!result.secure_url) {
      console.error('ERROR: No se encontró secure_url en la respuesta');
      console.error('Campos disponibles:', Object.keys(result));
      throw new Error('No se pudo subir el archivo a Cloudinary - no hay secure_url');
    }
    
    console.log('URL obtenida de Cloudinary:', result.secure_url);
    console.log('=== SUBIDA A CLOUDINARY COMPLETADA ===');
    return result.secure_url;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('Timeout al subir a Cloudinary');
      throw new Error(`Timeout al subir ${isVideo ? 'video' : 'imagen'}. Intenta con WiFi o un archivo más pequeño.`);
    }
    throw error;
  }
};

// Agregar función para detectar si es video (robusta)
const isVideo = (uri: any) => {
  if (!uri || typeof uri !== 'string') return false;
  const ext = uri.split('.').pop()?.toLowerCase();
  return ['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext || '');
};

// Agregar función para obtener thumbnail de Cloudinary
const isCloudinary = (url: string) => url.includes('cloudinary.com');
const getVideoThumbnail = (url: string) =>
  url.replace('/video/upload/', '/video/upload/so_2/').replace(/\.(mp4|mov|avi|webm|mkv)(\?.*)?$/i, '.jpg');


type Step = 'titulo' | 'conflicto' | 'formulario';

// Agregar interfaz para los borradores si no existe
interface BorradorReceta {
  titulo: string;
  descripcion: string;
  categoria: string;
  porciones: string;
  ingredientes: any[];
  pasos: any[];
  fotoFinal: (string | { uri: string; [key: string]: any })[];
  recetaId?: string;
}

// --- COMPONENTE PARA PREVISUALIZAR MEDIA (foto o video) ---
function MediaPreviewItem({ item, size = 90, onRemove }: { item: any, size?: number, onRemove: () => void }) {
  const [thumbError, setThumbError] = React.useState(false);
  const uri = typeof item === 'string' ? item : (item && item.uri ? item.uri : undefined);
  if (!uri) return null;
  return (
    <View style={{ marginRight: 8, position: 'relative' }}>
      {item.thumbnail ? (
        <View style={{ position: 'relative' }}>
          <Image source={{ uri: item.thumbnail }} style={{ width: size, height: size, borderRadius: 10 }} />
          {item.duration && (
            <View style={{ position: 'absolute', bottom: 4, right: 6, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1 }}>
              <Text style={{ color: '#fff', fontSize: size === 90 ? 12 : 10 }}>{item.duration}s</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={{ width: size, height: size, borderRadius: 10, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' }}>
          {isVideo(uri)
            ? isCloudinary(uri)
              ? thumbError
                ? <Text style={{ fontSize: size === 90 ? 32 : 40 }}>🎥</Text>
                : <Image source={{ uri: getVideoThumbnail(uri) }} style={{ width: size === 90 ? 32 : 40, height: size === 90 ? 32 : 40 }} onError={() => setThumbError(true)} />
              : <Text style={{ fontSize: size === 90 ? 32 : 40 }}>🎥</Text>
            : <Image source={{ uri }} style={{ width: size, height: size, borderRadius: 10 }} />
          }
        </View>
      )}
      <TouchableOpacity
        style={{ position: 'absolute', top: 2, right: 2, backgroundColor: '#FFF', borderRadius: 10, paddingHorizontal: size === 90 ? 5 : 6, paddingVertical: size === 90 ? 2 : 2, zIndex: 10, elevation: 4 }}
        onPress={onRemove}
      >
        <Text style={{ fontWeight: 'bold', fontSize: size === 90 ? 17 : 20, color: '#D32F2F', lineHeight: size === 90 ? 17 : 20 }}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function CargarRecetaWizard() {
  // Log global al montar el componente
  console.log('== CARGAR RECETA MODAL MONTADO ==');
  const params = useLocalSearchParams();
  const [step, setStep] = useState<Step>('titulo');
  const [loading, setLoading] = useState(false);
  // Cambiar el estado loadingPicker para que sea string | false
  const [loadingPicker, setLoadingPicker] = useState<string | false>(false);

  // Modales visuales
  const [modalExito, setModalExito] = useState(false);
  const [modalError, setModalError] = useState({ visible: false, mensaje: '' });
  const [modalWarning, setModalWarning] = useState({ visible: false, mensaje: '' });
  const [successDraft, setSuccessDraft] = useState(false);

  // Campos receta
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [porciones, setPorciones] = useState('');
  const [user, setUser] = useState<string | null>(null);
  const [recetaId, setRecetaId] = useState<string | null>(null);

  // Ingredientes y pasos
  const [ingredientes, setIngredientes] = useState([{ nombre: '', cantidad: '', unidad: '' }]);
  const [pasos, setPasos] = useState([{ descripcion: '', media: [] as string[] }]);
  const [fotoFinal, setFotoFinal] = useState<string[]>([]);

  // Modal picker de categorías e ingredientes
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [categoriaModal, setCategoriaModal] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<any[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  const [allIngredients, setAllIngredients] = useState<any[]>([]);
  const [ingredienteModalIndex, setIngredienteModalIndex] = useState<number | null>(null);
  const [ingredienteFiltro, setIngredienteFiltro] = useState('');
  const [ingredientesSugeridos, setIngredientesSugeridos] = useState<any[]>([]);
  const [loadingIngredientes, setLoadingIngredientes] = useState(false);

  const [showWifiModal, setShowWifiModal] = useState(false);
  const [userAlias, setUserAlias] = useState<string | null>(null);

  const { isConnected, type } = useConnection();
  const router = useRouter();

  useEffect(() => {
    const getAlias = async () => {
      const userInfoString = await AsyncStorage.getItem('userInfo');
      if (userInfoString) {
        const user = JSON.parse(userInfoString);
        setUserAlias(user.alias);
      }
    };
    getAlias();
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const info = await AsyncStorage.getItem('userInfo');
      if (info) {
        const parsed = JSON.parse(info);
        setUser(parsed.alias);
      }
    };
    getUser();
  }, []);

  // ----------- ENVIAR O MODIFICAR SEGÚN CONTEXTO -----------
  const handleCargarReceta = () => {
    console.log('== [handleCargarReceta] recetaId:', recetaId);
    if (!descripcion.trim() || !categoria.trim() || !porciones.trim() || !titulo.trim()) {
      setModalError({ visible: true, mensaje: 'Faltan campos obligatorios' });
      return;
    }
    if (!isConnected) {
      setModalWarning({ visible: true, mensaje: 'No hay conexión a internet. Receta guardada como borrador.' });
      if (!userAlias) return;
      const receta = {
        titulo,
        descripcion,
        categoria,
        porciones,
        ingredientes,
        pasos,
        fotoFinal,
        ...(recetaId ? { recetaId } : {}), // Guardar recetaId si existe
      };
      console.log('== [handleCargarReceta] Guardando borrador:', receta);
      AsyncStorage.getItem(`pendingRecipes_${userAlias}`).then(data => {
        let borradores: BorradorReceta[] = data ? JSON.parse(data) : [];
        // Reemplazar si existe por recetaId o título
        const idx = borradores.findIndex((b: BorradorReceta) => (receta.recetaId && b.recetaId === receta.recetaId) || (!receta.recetaId && b.titulo === receta.titulo));
        if (idx !== -1) {
          borradores[idx] = receta;
        } else {
          borradores.push(receta);
        }
        AsyncStorage.setItem(`pendingRecipes_${userAlias}`, JSON.stringify(borradores)).then(() => {
          setSuccessDraft(true);
        });
      });
      return;
    }
    if (type === 'cellular') {
      console.log('== [handleCargarReceta] Publicando con datos móviles, recetaId:', recetaId);
      setShowWifiModal(true);
      return;
    }
    if (recetaId) {
      console.log('== [handleCargarReceta] Llamando a modificarReceta (PUT), recetaId:', recetaId);
      modificarReceta();
    } else {
      console.log('== [handleCargarReceta] Llamando a enviarReceta (POST), recetaId:', recetaId);
      enviarReceta();
    }
  };

  // --------- CARGA DE BORRADOR: setear recetaId si existe ---------
  useEffect(() => {
    // Si viene un id por params, setearlo
    if (params && params.id) {
      setRecetaId(params.id as string);
    }
    // Si se está cargando un borrador desde AsyncStorage
    if (params && params.borrador) {
      try {
        const borrador = JSON.parse(params.borrador as string);
        if (borrador.recetaId) {
          console.log('== [useEffect] Cargando borrador, recetaId:', borrador.recetaId);
          setRecetaId(borrador.recetaId);
        }
      } catch (e) {
        // No es un borrador válido
      }
    }
  }, [params]);

  useEffect(() => {
    const fetchAllCategories = async () => {
      setLoadingCategorias(true);
      try {
        const res = await fetch('https://bon-appetit-production.up.railway.app/api/categories');
        const data = await res.json();
        if (data.categories) {
          setAllCategories(data.categories);
          setCategoriasFiltradas(data.categories);
        }
      } catch { }
      finally { setLoadingCategorias(false); }
    };
    if (categoriaModal && allCategories.length === 0) fetchAllCategories();
    if (!categoriaModal) setCategoriaFiltro('');
  }, [categoriaModal]);

  useEffect(() => {
    if (categoriaModal) {
      const filtradas = allCategories.filter(
        (cat: any) =>
          cat.name && cat.name.toLowerCase().includes(categoriaFiltro.trim().toLowerCase())
      );
      setCategoriasFiltradas(filtradas);
    }
  }, [categoriaFiltro, categoriaModal, allCategories]);

  const handleCategoriaSelect = (item: string) => {
    setCategoria(item);
    setCategoriaModal(false);
    setCategoriaFiltro('');
  };

  useEffect(() => {
    const fetchAllIngredients = async () => {
      setLoadingIngredientes(true);
      try {
        const res = await fetch('https://bon-appetit-production.up.railway.app/api/ingredients');
        const data = await res.json();
        if (data.status === 'success') {
          setAllIngredients(data.ingredients);
          setIngredientesSugeridos(data.ingredients);
        }
      } catch { }
      finally { setLoadingIngredientes(false); }
    };
    if (ingredienteModalIndex !== null && allIngredients.length === 0) fetchAllIngredients();
    if (ingredienteModalIndex === null) setIngredienteFiltro('');
  }, [ingredienteModalIndex]);

  useEffect(() => {
    if (ingredienteModalIndex !== null && ingredienteFiltro.trim() !== '') {
      const filtered = allIngredients.filter((ing: any) =>
        ing.name && ing.name.toLowerCase().includes(ingredienteFiltro.trim().toLowerCase())
      );
      setIngredientesSugeridos(filtered);
    } else if (ingredienteModalIndex !== null) {
      setIngredientesSugeridos(allIngredients);
    }
  }, [ingredienteFiltro, ingredienteModalIndex, allIngredients]);

  const handleIngredienteSelect = (name: string) => {
    if (ingredienteModalIndex !== null) {
      const nuevos = [...ingredientes];
      nuevos[ingredienteModalIndex].nombre = name;
      setIngredientes(nuevos);
      setIngredienteModalIndex(null);
      setIngredienteFiltro('');
      setIngredientesSugeridos([]);
    }
  };

  // -------- VALIDACIÓN DE TÍTULO CON EL BACKEND (EXACTA) --------
  const validarTitulo = async (titulo: string) => {
    if (!user) return false;
    const url = `https://bon-appetit-production.up.railway.app/api/recipies?title=${encodeURIComponent(titulo)}&user=${encodeURIComponent(user)}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data.payload)) {
        const receta = data.payload.find(
          (r: any) => r.title.trim().toLowerCase() === titulo.trim().toLowerCase()
        );
        if (receta) {
          setRecetaId(receta._id);
          return true;
        }
      }
      setRecetaId(null);
      return false;
    } catch (err) {
      setModalError({ visible: true, mensaje: 'No se pudo validar el título' });
      return false;
    }
  };

  // -------- OBTENER DATOS DE LA RECETA EXISTENTE DEL BACKEND POR ID --------
  const obtenerRecetaExistente = async () => {
    if (!recetaId) return;
    const url = `https://bon-appetit-production.up.railway.app/api/recipies/${recetaId}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data.payload) && data.payload.length > 0) {
        const receta = data.payload[0];
        setDescripcion(receta.description || '');
        setCategoria(receta.category || '');
        setPorciones(receta.portions ? String(receta.portions) : '');
        setIngredientes(parseIngredientes(receta.ingredients));
        setPasos(parsePasos(receta.stepsList));
        setFotoFinal([
          ...(receta.image_url ? [receta.image_url] : []),
          ...(Array.isArray(receta.aditionalMedia) ? receta.aditionalMedia : [])
        ]);
      }
    } catch {
      setModalError({ visible: true, mensaje: 'No se pudo cargar la receta existente' });
    }
  };

  // --- FUNCIONES PARA FORMATO INGREDIENTES Y PASOS ---
  function ingredientesParaBackend() {
    return ingredientes.map(i => ({
      name: i.nombre,
      quantity: i.cantidad,
      unit: i.unidad
    }));
  }

  function pasosParaBackend() {
    return pasos.map(p => ({
      description: p.descripcion,      // Cambiá a "texto" si tu backend lo pide, pero usualmente es "description"
      urls: p.media ? p.media : []
    }));
  }

  // --------- CREAR RECETA NUEVA (POST) ---------
  const enviarReceta = async () => {
    console.log('=== INICIANDO ENVÍO DE RECETA ===');
    
    if (!descripcion.trim() || !categoria.trim() || !porciones.trim() || !titulo.trim()) {
      setModalError({ visible: true, mensaje: 'Faltan campos obligatorios' });
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Token no encontrado');
      
      console.log('Token encontrado:', token.substring(0, 20) + '...');

      let imageUrls: string[] = [];

      if (fotoFinal && fotoFinal.length > 0) {
        for (const item of fotoFinal) {
          const uri = typeof item === 'string' ? item : (item && item.uri ? item.uri : undefined);
          if (!uri) continue;
          if (uri.startsWith('file')) {
            const url = await uploadMediaToCloudinary(uri);
            imageUrls.push(url);
          } else {
            imageUrls.push(uri);
          }
        }
      }

      console.log('Procesando pasos con imágenes...');
      const pasosConImagenes = await Promise.all(
        pasos.map(async (p, index) => {
          let urls: string[] = [];
          for (const item of p.media || []) {
            const uri = typeof item === 'string' ? item : (item && item.uri ? item.uri : undefined);
            if (!uri) continue;
            if (uri.startsWith('file')) {
              try {
                const url = await uploadMediaToCloudinary(uri);
                urls.push(url);
              } catch (e) {
                console.error('Error al subir media de paso:', e);
                throw new Error('Error al subir una imagen o video de paso');
              }
            } else {
              urls.push(uri);
            }
          }
          return {
            description: p.descripcion,
            urls,
          };
        })
      );

      console.log('Pasos procesados:', pasosConImagenes.length);

      const body = {
        title: titulo,
        description: descripcion,
        category: categoria,
        portions: porciones,
        ingredients: ingredientesParaBackend(),
        stepsList: pasosConImagenes,
        aditionalMedia: imageUrls.length > 1 ? imageUrls.slice(1) : [],
        image_url: imageUrls[0] || null,
        isVerificated: false,
      };

      console.log('Body preparado:', JSON.stringify(body, null, 2));

      console.log('Enviando al backend...');
      
      // Detectar si hay videos en la receta
      const hasVideos = pasosConImagenes.some(paso => 
        paso.urls.some(url => url && ['mp4', 'mov', 'avi', 'webm', 'mkv'].some(ext => url.includes(ext)))
      ) || (imageUrls.some(url => url && ['mp4', 'mov', 'avi', 'webm', 'mkv'].some(ext => url.includes(ext))) || imageUrls.length === 0);
      
      const backendTimeout = hasVideos ? 90000 : 30000; // 90 segundos para videos, 30 para imágenes
      console.log('Timeout para backend:', backendTimeout + 'ms');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), backendTimeout);
      
      try {
        const res = await fetch('https://bon-appetit-production.up.railway.app/api/recipies', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        console.log('Respuesta del backend - Status:', res.status);
        console.log('Respuesta del backend - OK:', res.ok);
        
        const responseText = await res.text();
        console.log('Respuesta del backend - Texto:', responseText);
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
          console.log('Respuesta del backend - JSON:', responseData);
        } catch (e) {
          console.error('Error parseando JSON de respuesta:', e);
          throw new Error('Respuesta inválida del servidor');
        }

        if (!res.ok) {
          console.error('Error del backend:', responseData);
          throw new Error(responseData.error || responseData.message || 'Error al enviar la receta');
        }
        
        console.log('=== RECETA ENVIADA EXITOSAMENTE ===');
        setModalExito(true);

        // Limpiar formulario
        setTitulo('');
        setDescripcion('');
        setCategoria('');
        setPorciones('');
        setIngredientes([{ nombre: '', cantidad: '', unidad: '' }]);
        setPasos([{ descripcion: '', media: [] }]);
        setFotoFinal([]);

      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.error('Timeout al enviar al backend');
          throw new Error('Timeout al enviar la receta. Intenta con WiFi o un archivo más pequeño.');
        }
        throw error;
      }

    } catch (err: any) {
      console.error('Error en enviarReceta:', err);
      setModalError({ visible: true, mensaje: err.message || 'No se pudo enviar la receta' });
    }
    setLoading(false);
  };


  // --------- MODIFICAR RECETA EXISTENTE (PUT) ---------
const modificarReceta = async () => {
  console.log('== [modificarReceta] recetaId:', recetaId);
  if (!descripcion.trim() || !categoria.trim() || !porciones.trim() || !titulo.trim()) {
    setModalError({ visible: true, mensaje: 'Faltan campos obligatorios' });
    return;
  }
  if (!recetaId) {
    setModalError({ visible: true, mensaje: 'No hay receta a modificar' });
    return;
  }

  setLoading(true);
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) throw new Error('Token no encontrado');

    // 1. Subir imagen final si es local
    let imageUrls: string[] = [];
    if (fotoFinal && fotoFinal.length > 0) {
      for (const item of fotoFinal) {
        const uri = typeof item === 'string' ? item : (item && item.uri ? item.uri : undefined);
        if (!uri) continue;
        if (uri.startsWith('file')) {
          const url = await uploadMediaToCloudinary(uri);
          imageUrls.push(url);
        } else {
          imageUrls.push(uri);
        }
      }
    }

    // 2. Subir imágenes de pasos si son locales
    const pasosConImagenes = await Promise.all(
      pasos.map(async (p) => {
        let urls: string[] = [];
        for (const item of p.media || []) {
          const uri = typeof item === 'string' ? item : (item && item.uri ? item.uri : undefined);
          if (!uri) continue;
          if (uri.startsWith('file')) {
            try {
              const url = await uploadMediaToCloudinary(uri);
              urls.push(url);
            } catch (e) {
              console.error('Error al subir media de paso:', e);
              throw new Error('Error al subir una imagen o video de paso');
            }
          } else {
            urls.push(uri);
          }
        }
        return {
          description: p.descripcion,
          urls,
        };
      })
    );

    // 3. Armar body
    const body = {
      title: titulo,
      description: descripcion,
      category: categoria,
      portions: porciones,
      ingredients: ingredientesParaBackend(),
      stepsList: pasosConImagenes,
      aditionalMedia: imageUrls.length > 1 ? imageUrls.slice(1) : [],
      image_url: imageUrls[0] || null,
      isVerificated: false,
    };

    console.log('== BODY QUE SE ENVÍA AL MODIFICAR RECETA ==', JSON.stringify(body, null, 2));
    const res = await fetch(`https://bon-appetit-production.up.railway.app/api/recipies/${recetaId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error('Error al modificar la receta');

    setModalExito(true);
    setTitulo('');
    setDescripcion('');
    setCategoria('');
    setPorciones('');
    setIngredientes([{ nombre: '', cantidad: '', unidad: '' }]);
    setPasos([{ descripcion: '', media: [] }]);
    setFotoFinal([]);

  } catch (err: any) {
    setModalError({ visible: true, mensaje: err.message || 'No se pudo modificar la receta' });
  }
  setLoading(false);
};


  // ----------- ENVIAR O MODIFICAR SEGÚN CONTEXTO -----------
  // Eliminar la segunda declaración duplicada de handleCargarReceta (deja solo la primera, con logs y lógica mejorada)

  // ----------- UI -----------

  // Estados de error para validación
  const [errores, setErrores] = useState({
    titulo: false,
    descripcion: false, // ya no se usa como requerido
    categoria: false,
    porciones: false,
    ingredientes: [] as boolean[], // uno por ingrediente
    pasos: [] as boolean[], // uno por paso
  });

  // Validación al enviar
  const validarCampos = () => {
    const err = {
      titulo: !titulo.trim(),
      descripcion: false, // descripcion no es requerida
      categoria: !categoria.trim(),
      porciones: !porciones.trim(),
      ingredientes: ingredientes.map(ing => {
        if (!ing.nombre) return false; // Si no hay nombre, no es requerido
        return !ing.cantidad || !ing.unidad;
      }),
      pasos: pasos.map(p => !p.descripcion.trim()),
    };
    setErrores(err);
    // Si hay algún error, retorna false
    return !(
      err.titulo ||
      err.categoria ||
      err.porciones ||
      err.ingredientes.some(Boolean) ||
      err.pasos.some(Boolean)
    );
  };

  // Cambiar el máximo de media
  const MAX_MEDIA = 3;
  // En la selección de media para pasos:
  const handlePickMediaPaso = async (index: number) => {
    setLoadingPicker(`paso-${index}`);
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        setModalError({ visible: true, mensaje: 'Permiso denegado para galería' });
        return;
      }
      const actuales = pasos[index].media?.length || 0;
      if (actuales >= MAX_MEDIA) {
        setModalError({ visible: true, mensaje: `Máximo ${MAX_MEDIA} archivos por paso.` });
        return;
      }
      const disponibles = MAX_MEDIA - actuales;
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        base64: false,
        allowsMultipleSelection: true
      });
      if (!resultado.canceled && resultado.assets.length > 0) {
        let nuevasMedias: any[] = [];
        for (const asset of resultado.assets) {
          if (asset.type === 'video') {
            let durationSec = asset.duration;
            if (typeof durationSec === 'number') {
              if (durationSec > 100) durationSec = durationSec / 1000;
              if (durationSec > 25) {
                setModalError({ visible: true, mensaje: 'El video seleccionado dura más de 25 segundos. Por favor, elige uno más corto.' });
                continue;
              }
            } else {
              setModalWarning({ visible: true, mensaje: 'No se pudo verificar la duración del video. Por favor, asegúrate de que dure menos de 25 segundos.' });
            }
            try {
              const { uri: thumbnail } = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 1000 });
              nuevasMedias.push({ uri: asset.uri, thumbnail, duration: durationSec ? Math.round(durationSec) : undefined });
            } catch (e) {
              nuevasMedias.push({ uri: asset.uri, duration: durationSec ? Math.round(durationSec) : undefined });
            }
          } else {
            nuevasMedias.push({ uri: asset.uri });
          }
        }
        if (nuevasMedias.length > disponibles) {
          setModalWarning({ visible: true, mensaje: `Seleccionaste ${nuevasMedias.length} archivos, solo se agregarán los primeros ${disponibles}.` });
        }
        nuevasMedias = nuevasMedias.slice(0, disponibles);
        const nuevos = [...pasos];
        nuevos[index].media = [...(nuevos[index].media || []), ...nuevasMedias];
        setPasos(nuevos);
      }
    } finally {
      setLoadingPicker(false);
    }
  };

  // En la selección de foto final:
  const handlePickMediaFinal = async () => {
    setLoadingPicker('final');
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        setModalError({ visible: true, mensaje: 'Permiso denegado para galería' });
        return;
      }
      const actuales = fotoFinal.length;
      if (actuales >= MAX_MEDIA) {
        setModalError({ visible: true, mensaje: `Máximo ${MAX_MEDIA} archivos en la foto final.` });
        return;
      }
      const disponibles = MAX_MEDIA - actuales;
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        base64: false,
        allowsMultipleSelection: true
      });
      if (!resultado.canceled && resultado.assets.length > 0) {
        let nuevasMedias: any[] = [];
        for (const asset of resultado.assets) {
          if (asset.type === 'video') {
            let durationSec = asset.duration;
            if (typeof durationSec === 'number') {
              if (durationSec > 100) durationSec = durationSec / 1000;
            }
            try {
              const { uri: thumbnail } = await VideoThumbnails.getThumbnailAsync(asset.uri, { time: 1000 });
              nuevasMedias.push({ uri: asset.uri, thumbnail, duration: durationSec ? Math.round(durationSec) : undefined });
            } catch (e) {
              nuevasMedias.push({ uri: asset.uri, duration: durationSec ? Math.round(durationSec) : undefined });
            }
          } else {
            nuevasMedias.push({ uri: asset.uri });
          }
        }
        if (nuevasMedias.length > disponibles) {
          setModalWarning({ visible: true, mensaje: `Seleccionaste ${nuevasMedias.length} archivos, solo se agregarán los primeros ${disponibles}.` });
        }
        nuevasMedias = nuevasMedias.slice(0, disponibles);
        setFotoFinal(prev => [...prev, ...nuevasMedias]);
      }
    } finally {
      setLoadingPicker(false);
    }
  };

  if (step === 'titulo') {
    return (
      <KeyboardAvoidingView
        style={styles.fullScreen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.label}>Título de receta</Text>
        <TextInput
          style={styles.input}
          value={titulo}
          onChangeText={setTitulo}
          placeholder="Ej: Pizza Carbonara"
          autoFocus
        />
        <TouchableOpacity
          style={styles.button}
          onPress={async () => {
            if (!titulo.trim()) {
              setModalError({ visible: true, mensaje: 'El título no puede estar vacío' });
              return;
            }
            setLoading(true);
            const existe = await validarTitulo(titulo);
            setLoading(false);
            if (existe) {
              setStep('conflicto');
            } else {
              setDescripcion('');
              setCategoria('');
              setPorciones('');
              setIngredientes([{ nombre: '', cantidad: '', unidad: '' }]);
              setPasos([{ descripcion: '', media: [] }]);
              setFotoFinal([]);
              setStep('formulario');
            }
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Siguiente</Text>
          )}
        </TouchableOpacity>
        <SuccessModal
          visible={modalExito}
          onClose={() => {
            setModalExito(false);
            router.back();
          }}
          title="¡Éxito!"
          message="Receta cargada. Queda pendiente de aprobación."
        />
        <ErrorModal
          visible={modalError.visible}
          onClose={() => setModalError({ visible: false, mensaje: '' })}
          title="Error"
          message={modalError.mensaje}
        />

        <WarningModal
          visible={modalWarning.visible}
          onClose={() => setModalWarning({ visible: false, mensaje: '' })}
          title="Atención"
          message={modalWarning.mensaje}
        />
      </KeyboardAvoidingView>
    );
  }

  if (step === 'conflicto') {
    console.log('== RENDER PASO CONFLICTO ==');
    return (
      <View style={styles.fullScreen}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.conflictTitle}>¡Atención!</Text>
        <Text style={styles.conflictMsg}>Ya existe una receta tuya con este nombre.</Text>
        <View style={styles.conflictBtnRow}>
          <TouchableOpacity
            style={[styles.conflictBtn, { marginRight: 10 }]}
            onPress={async () => {
              console.log('== CLICK EN BOTÓN EDITAR LA EXISTENTE ==');
              // Refuerzo: setear recetaId explícitamente antes de obtener datos
              const existe = await validarTitulo(titulo);
              if (existe && recetaId) {
                console.log('== CLIC EN EDITAR LA EXISTENTE ==');
                // Trae la receta y loguea los datos crudos
                const url = `https://bon-appetit-production.up.railway.app/api/recipies/${recetaId}`;
                const res = await fetch(url);
                const data = await res.json();
                console.log('DATA CRUDA DE LA RECETA:', data);
                if (Array.isArray(data.payload) && data.payload.length > 0) {
                  const receta = data.payload[0];
                  console.log('RECETA OBTENIDA:', receta);
                  console.log('image_url:', receta.image_url);
                  console.log('aditionalMedia:', receta.aditionalMedia);
                  console.log('stepsList:', receta.stepsList);
                  if (receta.stepsList && receta.stepsList.length > 0) {
                    (receta.stepsList as any[]).forEach((step: any, idx: number) => {
                      console.log(`Paso ${idx + 1}:`, step);
                    });
                  }
                }
                await obtenerRecetaExistente();
                setStep('formulario');
              } else {
                setModalError({ visible: true, mensaje: 'No se pudo identificar la receta existente.' });
              }
            }}
            activeOpacity={0.9}
          >
            <Text style={styles.conflictBtnText}>Editar la existente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.conflictBtn, { backgroundColor: '#D32F2F', marginLeft: 10 }]}
            onPress={() => setStep('titulo')}
            activeOpacity={0.9}
          >
            <Text style={styles.conflictBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
        <SuccessModal
          visible={modalExito}
          onClose={() => {
            setModalExito(false);
            router.back();
          }}
          title="¡Éxito!"
          message="Receta cargada. Queda pendiente de aprobación."
        />
        <WarningModal
          visible={modalError.visible}
          onClose={() => setModalError({ visible: false, mensaje: '' })}
          title="Error"
          message={modalError.mensaje}
        />
      </View>
    );
  }

  // ---------- FORMULARIO ----------
  return (
    <ScrollView contentContainerStyle={[styles.fullScreen, { paddingBottom: 60 }]}>
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
      <Text style={styles.label}>
        Título de receta <Text style={{ color: 'red' }}>*</Text>
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: '#F0F0F0', color: '#888' }, errores.titulo && { borderColor: 'red' }]}
        value={titulo}
        editable={false}
      />
      {errores.titulo && <Text style={styles.errorText}>Este campo es obligatorio</Text>}

      <Text style={styles.label}>
        Descripción general <Text style={{ color: 'red' }}>*</Text>
      </Text>
      <TextInput
        style={[styles.textarea, errores.descripcion && { borderColor: 'red' }]}
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Ej: Masa crocante, salsa de tomate y queso derretido..."
        multiline
      />
      {errores.descripcion && <Text style={styles.errorText}>Este campo es obligatorio</Text>}

      {/* ----------- Picker de Categoría ----------- */}
      <Text style={styles.label}>
        Categoría <Text style={{ color: 'red' }}>*</Text>
      </Text>
      <TouchableOpacity style={[styles.input, errores.categoria && { borderColor: 'red' }]} onPress={() => setCategoriaModal(true)}>
        <Text style={{ color: categoria ? '#222' : '#999' }}>
          {categoria ? categoria : 'Seleccionar categoría...'}
        </Text>
      </TouchableOpacity>
      {errores.categoria && <Text style={styles.errorText}>Este campo es obligatorio</Text>}

      {/* ----------- Porciones ----------- */}
      <Text style={styles.label}>
        Porciones <Text style={{ color: 'red' }}>*</Text>
      </Text>
      <TextInput
        style={[styles.input, errores.porciones && { borderColor: 'red' }]}
        value={porciones}
        onChangeText={setPorciones}
        placeholder="Ej: 4"
        keyboardType="numeric"
      />
      {errores.porciones && <Text style={styles.errorText}>Este campo es obligatorio</Text>}

      {/* ----------- Ingredientes ----------- */}
      <Text style={styles.label}>
        Ingredientes <Text style={{ color: 'red' }}>*</Text>
      </Text>
      {ingredientes.map((item, index) => (
        <View key={index} style={{ marginBottom: 8 }}>
          <TouchableOpacity
            style={[styles.input, { marginBottom: 6 }, errores.ingredientes[index] && { borderColor: 'red' }]}
            onPress={() => setIngredienteModalIndex(index)}
          >
            <Text style={{ color: item.nombre ? '#222' : '#999' }}>
              {item.nombre ? item.nombre : 'Seleccionar ingrediente...'}
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1 }, errores.ingredientes[index] && { borderColor: 'red' }]}
              placeholder="Cantidad"
              value={item.cantidad}
              onChangeText={text => {
                const nuevos = [...ingredientes];
                nuevos[index] = { ...nuevos[index], cantidad: text };
                setIngredientes(nuevos);
              }}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, { flex: 1 }, errores.ingredientes[index] && { borderColor: 'red' }]}
              placeholder="Unidad"
              value={item.unidad}
              onChangeText={text => {
                const nuevos = [...ingredientes];
                nuevos[index] = { ...nuevos[index], unidad: text };
                setIngredientes(nuevos);
              }}
            />
          </View>
          {/* Solo mostrar error si hay nombre y falta cantidad o unidad */}
          {item.nombre && errores.ingredientes[index] && <Text style={styles.errorText}>Completa cantidad y unidad</Text>}
          {index > 0 && (
            <TouchableOpacity
              onPress={() => setIngredientes(ingredientes.filter((_, i) => i !== index))}
              style={{ alignSelf: 'flex-end', marginBottom: 8 }}
            >
              <Text style={{ color: '#D32F2F' }}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity
        onPress={() =>
          setIngredientes([...ingredientes, { nombre: '', cantidad: '', unidad: '' }])
        }
        style={styles.addButton}
      >
        <Text style={styles.addButtonText}>Agregar ingrediente</Text>
      </TouchableOpacity>

      {/* ----------- Pasos ----------- */}
      <Text style={styles.label}>
        Pasos <Text style={{ color: 'red' }}>*</Text>
      </Text>
      {pasos.map((paso, index) => (
        <View key={index} style={{ marginBottom: 19 , marginTop:2}}>
          <TextInput
            style={[styles.textarea, errores.pasos[index] && { borderColor: 'red' }]}
            placeholder={`Paso ${index + 1}`}
            value={paso.descripcion}
            onChangeText={text => {
              const nuevos = [...pasos];
              nuevos[index] = { ...nuevos[index], descripcion: text };
              setPasos(nuevos);
            }}
            multiline
          />
          {errores.pasos[index] && <Text style={styles.errorText}>Este campo es obligatorio</Text>}
          {/* Botón para agregar más media */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <TouchableOpacity
              style={styles.addMediaButton}
              onPress={() => handlePickMediaPaso(index)}
            >
              <Text style={styles.addButtonText}>Agregar foto o video del paso</Text>
            </TouchableOpacity>
            <Text style={{ marginLeft: 8, color: '#666', fontSize: 13 }}>(máximo 3)</Text>
          </View>
          {/* Galería de media del paso */}
          <ScrollView horizontal style={{ flexDirection: 'row', marginVertical: 6 }}>
            {paso.media && paso.media.map((item, mIdx) => (
              <MediaPreviewItem
                key={mIdx}
                item={item}
                size={90}
                onRemove={() => {
                  const nuevos = [...pasos];
                  nuevos[index].media = nuevos[index].media.filter((_, i) => i !== mIdx);
                  setPasos(nuevos);
                }}
              />
            ))}
          </ScrollView>
          {index > 0 && (
            <TouchableOpacity
              onPress={() => setPasos(pasos.filter((_, i) => i !== index))}
              style={{ alignSelf: 'flex-end', marginBottom: 8 }}
            >
              <Text style={{ color: '#D32F2F' }}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      <TouchableOpacity
        onPress={() => setPasos([...pasos, { descripcion: '', media: [] }])}
        style={styles.addButton}
      >
        <Text style={styles.addButtonText}>Agregar paso</Text>
      </TouchableOpacity>

      {/* Foto final */}
      <Text style={styles.label}>Foto final</Text>
      {/* Botón para agregar más media */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <TouchableOpacity
          style={styles.addMediaButton}
          onPress={handlePickMediaFinal}
        >
          <Text style={styles.addButtonText}>Agregar foto o video</Text>
        </TouchableOpacity>
        <Text style={{ marginLeft: 8, color: '#666', fontSize: 13 }}>(máximo 3)</Text>
      </View>
      {/* Galería de media final */}
      <ScrollView horizontal style={{ flexDirection: 'row', marginVertical: 6 }}>
        {fotoFinal.map((item, idx) => (
          <MediaPreviewItem
            key={idx}
            item={item}
            size={120}
            onRemove={() => setFotoFinal(fotoFinal.filter((_, i) => i !== idx))}
          />
        ))}
      </ScrollView>
      {loadingPicker && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)' }}>
          <ActivityIndicator size="large" color="#F59C1D" />
        </View>
      )}

      {/* Botón de envío */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (!validarCampos()) return;
          handleCargarReceta();
        }}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{recetaId ? 'Modificar receta' : 'Cargar receta'}</Text>
        )}
      </TouchableOpacity>

      {/* --------- MODALES --------- */}
      <SuccessModal
        visible={modalExito}
        onClose={() => {
          setModalExito(false);
          router.back();
        }}
        title="¡Éxito!"
        message="Receta enviada. Está pendiente de aprobación."
      />
      <WarningModal
        visible={modalError.visible}
        onClose={() => setModalError({ visible: false, mensaje: '' })}
        title="Error"
        message={modalError.mensaje}
      />

      {/* --------- MODAL DE CATEGORÍAS --------- */}
      <Modal visible={categoriaModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setCategoriaModal(false)}
          activeOpacity={1}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar categoría..."
              value={categoriaFiltro}
              onChangeText={setCategoriaFiltro}
              autoFocus
            />
            {loadingCategorias && <Text>Cargando categorías...</Text>}
            <FlatList
              data={categoriasFiltradas}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleCategoriaSelect(item.name)}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="always"
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* --------- MODAL DE INGREDIENTES --------- */}
      <Modal visible={ingredienteModalIndex !== null} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setIngredienteModalIndex(null)}
          activeOpacity={1}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ingrediente..."
              value={ingredienteFiltro}
              onChangeText={setIngredienteFiltro}
              autoFocus
            />
            {loadingIngredientes && <Text>Cargando ingredientes...</Text>}
            <FlatList
              data={ingredientesSugeridos}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleIngredienteSelect(item.name)}
                >
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="always"
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <PublishRecipeNoWifiModal
        visible={showWifiModal}
        onPublishWithMobile={async () => {
          console.log('=== PUBLICANDO CON DATOS MÓVILES === recetaId:', recetaId);
          setShowWifiModal(false);
          try {
            if (recetaId) {
              console.log('Llamando a modificarReceta (PUT), recetaId:', recetaId);
              await modificarReceta();
            } else {
              console.log('Llamando a enviarReceta (POST), recetaId:', recetaId);
              await enviarReceta();
            }
            setModalExito(true);
          } catch (error) {
            console.error('Error publicando con datos móviles:', error);
            setModalError({ 
              visible: true, 
              mensaje: 'Error al publicar con datos móviles. Intenta con WiFi o guarda como borrador.' 
            });
          }
        }}
        onPublishWithWifi={async () => {
          setShowWifiModal(false);
          if (!userAlias) return;
          const receta = {
            titulo,
            descripcion,
            categoria,
            porciones,
            ingredientes,
            pasos,
            fotoFinal,
            ...(recetaId ? { recetaId } : {}), // Guardar recetaId si existe
          };
          console.log('GUARDANDO BORRADOR', { recetaId, fotoFinal, pasos });
          const data = await AsyncStorage.getItem(`pendingRecipes_${userAlias}`);
          let borradores: BorradorReceta[] = data ? JSON.parse(data) : [];
          // Reemplazar si existe por recetaId o título
          const idx = borradores.findIndex((b: BorradorReceta) => (receta.recetaId && b.recetaId === receta.recetaId) || (!receta.recetaId && b.titulo === receta.titulo));
          if (idx !== -1) {
            borradores[idx] = receta;
          } else {
            borradores.push(receta);
          }
          await AsyncStorage.setItem(`pendingRecipes_${userAlias}`, JSON.stringify(borradores));
          setSuccessDraft(true);
        }}
        onClose={() => setShowWifiModal(false)}
      />
      <SuccessModal
        visible={modalExito}
        onClose={() => {
          setModalExito(false);
          router.back();
        }}
        title="¡Éxito!"
        message="Receta enviada. Está pendiente de aprobación y podés consultarla en Recetas pendientes de aprobación."
      />
      {successDraft && (
        <SuccessModal
          visible={successDraft}
          onClose={() => {
            setSuccessDraft(false);
            router.back();
          }}
          title="¡Borrador guardado!"
          message="Receta agregada a borradores. Podrás publicarla cuando tengas WiFi."
        />
      )}
    </ScrollView>
  );
}

// --- ESTILOS IGUAL QUE SIEMPRE ---
const styles = StyleSheet.create({
  fullScreen: {
    flexGrow: 1,
    paddingTop: 48,
    paddingHorizontal: 22,
    backgroundColor: '#F6F6F6',
    minHeight: '100%',
    justifyContent: 'flex-start',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 16,
  },
  closeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
    marginTop: 22,
    color: '#222',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#222',
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    fontSize: 16,
    minHeight: 80,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
    color: '#222',
  },
  button: {
    backgroundColor: '#025E45',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
  },
  addButton: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: 'rgba(2, 94, 69, 0.10)', // Verde traslúcido
  },
  addButtonText: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 15,
  },
  conflictTitle: {
    fontWeight: 'bold',
    fontSize: 23,
    marginTop: 38,
    marginBottom: 13,
    textAlign: 'center',
    color: '#222',
  },
  conflictMsg: {
    fontSize: 15,
    color: '#333',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 22,
  },
  conflictBtnRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  conflictBtn: {
    flex: 1,
    height: 54,
    backgroundColor: '#025E45',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conflictBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalContent: { backgroundColor: '#FFF', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%' },
  searchInput: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, paddingHorizontal: 12, height: 48, marginBottom: 12 },
  modalItem: { paddingVertical: 14, borderBottomColor: '#EEE', borderBottomWidth: 1 },
  modalItemText: { fontSize: 16 },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 2,
    marginLeft: 2,
  },
  addMediaButton: {
    backgroundColor: '#EEE',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 0,
    marginBottom: 1
  },
});
