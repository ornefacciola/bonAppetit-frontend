import ErrorModal from '@/components/ui/ErrorModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
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
    return [{ descripcion: '', media: null }];
  return arr.map((p: any) => ({
    descripcion: p.descripcion || p.description || p.texto || '',
    media:
      (p.urls && p.urls[0]) ||
      p.media ||
      p.image ||
      null,
  }));
};

const uploadImageToCloudinary = async (uri: string): Promise<string> => {
  const formData = new FormData();

  const filename = uri.split('/').pop() || 'image.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const ext = match ? match[1] : 'jpg';
  const type = `image/${ext}`;

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

  const res = await fetch('https://api.cloudinary.com/v1_1/drvtr4kxz/image/upload', {
    method: 'POST',
    body: formData,
  });

  const result = await res.json();

  if (!result.secure_url) {
    console.error('Error Cloudinary:', result);
    throw new Error('No se pudo subir la imagen a Cloudinary');
  }

  return result.secure_url;
};


type Step = 'titulo' | 'conflicto' | 'formulario';

export default function CargarRecetaWizard() {
  const [step, setStep] = useState<Step>('titulo');
  const [loading, setLoading] = useState(false);

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
  const [pasos, setPasos] = useState([{ descripcion: '', media: null as string | null }]);
  const [fotoFinal, setFotoFinal] = useState<string | null>(null);

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
        setFotoFinal(receta.image_url || null);
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
      urls: p.media ? [p.media] : []
    }));
  }

  // --------- CREAR RECETA NUEVA (POST) ---------
  const enviarReceta = async () => {
    if (!descripcion.trim() || !categoria.trim() || !porciones.trim() || !titulo.trim()) {
      setModalError({ visible: true, mensaje: 'Faltan campos obligatorios' });
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Token no encontrado');

      let imageUrl = null;

      if (fotoFinal) {
          imageUrl = await uploadImageToCloudinary(fotoFinal);
        }

    const pasosConImagenes = await Promise.all(
      pasos.map(async (p) => {
        let url = p.media;

        if (p.media && p.media.startsWith('file')) {
          try {
            url = await uploadImageToCloudinary(p.media);
          } catch (e) {
            console.error('Error al subir imagen de paso:', e);
            throw new Error('Error al subir una imagen de paso');
          }
        }

        return {
          description: p.descripcion,
          urls: url ? [url] : [],
        };
      })
    );

      const body = {
        title: titulo,
        description: descripcion,
        category: categoria,
        portions: porciones,
        ingredients: ingredientesParaBackend(),
        stepsList: pasosConImagenes,
        aditionalMedia: [],
        image_url: imageUrl,
        isVerificated: false,
      };

      const res = await fetch('https://bon-appetit-production.up.railway.app/api/recipies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Error al enviar la receta');
      setModalExito(true);

      // Limpiar formulario
      setTitulo('');
      setDescripcion('');
      setCategoria('');
      setPorciones('');
      setIngredientes([{ nombre: '', cantidad: '', unidad: '' }]);
      setPasos([{ descripcion: '', media: null }]);
      setFotoFinal(null);

    } catch (err: any) {
      setModalError({ visible: true, mensaje: err.message || 'No se pudo enviar la receta' });
    }
    setLoading(false);
  };


  // --------- MODIFICAR RECETA EXISTENTE (PUT) ---------
const modificarReceta = async () => {
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
    let imageUrl = fotoFinal;
    if (fotoFinal && fotoFinal.startsWith('file')) {
      imageUrl = await uploadImageToCloudinary(fotoFinal);
    }

    // 2. Subir imágenes de pasos si son locales
    const pasosConImagenes = await Promise.all(
      pasos.map(async (p) => {
        let url = p.media;

        if (p.media && p.media.startsWith('file')) {
          try {
            url = await uploadImageToCloudinary(p.media);
          } catch (e) {
            console.error('Error al subir imagen de paso:', e);
            throw new Error('Error al subir una imagen de paso');
          }
        }

        return {
          description: p.descripcion,
          urls: url ? [url] : [],
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
      aditionalMedia: [],
      image_url: imageUrl,
      isVerificated: false,
    };

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
    setPasos([{ descripcion: '', media: null }]);
    setFotoFinal(null);

  } catch (err: any) {
    setModalError({ visible: true, mensaje: err.message || 'No se pudo modificar la receta' });
  }
  setLoading(false);
};


  // ----------- ENVIAR O MODIFICAR SEGÚN CONTEXTO -----------
  const handleCargarReceta = () => {
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
      };
      AsyncStorage.getItem(`pendingRecipes_${userAlias}`).then(data => {
        const borradores = data ? JSON.parse(data) : [];
        borradores.push(receta);
        AsyncStorage.setItem(`pendingRecipes_${userAlias}`, JSON.stringify(borradores)).then(() => {
          setSuccessDraft(true);
        });
      });
      return;
    }
    if (type === 'cellular') {
      setShowWifiModal(true);
      return;
    }
    if (recetaId) {
      modificarReceta();
    } else {
      enviarReceta();
    }
  };

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
              setPasos([{ descripcion: '', media: null }]);
              setFotoFinal(null);
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
              await obtenerRecetaExistente();
              setStep('formulario');
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
        Descripción general
      </Text>
      <TextInput
        style={styles.textarea}
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Ej: Masa crocante, salsa de tomate y queso derretido..."
        multiline
      />
      {/* No error para descripción */}

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
        <View key={index} style={{ marginBottom: 8 }}>
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
          {/* FOTO POR PASO */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={async () => {
              const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permiso.granted) {
                setModalError({ visible: true, mensaje: 'Permiso denegado para galería' });
                return;
              }
              const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
                base64: false
              });
              if (!resultado.canceled && resultado.assets.length > 0) {
                const nuevos = [...pasos];
                nuevos[index].media = resultado.assets[0].uri;
                setPasos(nuevos);
              }
            }}
          >
            <Text style={styles.addButtonText}>
              {paso.media ? 'Cambiar foto del paso' : 'Agregar foto del paso'}
            </Text>
          </TouchableOpacity>
          {paso.media && (
            <View style={{ alignSelf: 'center', marginBottom: 8, position: 'relative', width: 90, height: 90 }}>
              <Image
                source={{ uri: paso.media }}
                style={{ width: 90, height: 90, borderRadius: 10 }}
              />
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  backgroundColor: '#FFF',
                  borderRadius: 10,
                  paddingHorizontal: 5,
                  paddingVertical: 2,
                  zIndex: 10,
                  elevation: 4,
                }}
                onPress={() => {
                  const nuevos = [...pasos];
                  nuevos[index].media = null;
                  setPasos(nuevos);
                }}
              >
                <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#D32F2F', lineHeight: 17 }}>×</Text>
              </TouchableOpacity>
            </View>
          )}
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
        onPress={() => setPasos([...pasos, { descripcion: '', media: null }])}
        style={styles.addButton}
      >
        <Text style={styles.addButtonText}>Agregar paso</Text>
      </TouchableOpacity>

      {/* Foto final */}
      <Text style={styles.label}>Foto final (opcional)</Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={async () => {
          const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (!permiso.granted) {
            setModalError({ visible: true, mensaje: 'Permiso denegado para galería' });
            return;
          }
          const resultado = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
            base64: false
          });
          if (!resultado.canceled && resultado.assets.length > 0) {
            setFotoFinal(resultado.assets[0].uri);
          }
        }}
      >
        <Text style={styles.addButtonText}>{fotoFinal ? 'Cambiar foto' : 'Agregar foto'}</Text>
      </TouchableOpacity>
      {fotoFinal && (
        <View style={{ alignSelf: 'center', marginBottom: 8, position: 'relative', width: 120, height: 120 }}>
          <Image
            source={{ uri: fotoFinal }}
            style={{ width: 120, height: 120, borderRadius: 12 }}
          />
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              backgroundColor: '#FFF',
              borderRadius: 12,
              paddingHorizontal: 6,
              paddingVertical: 2,
              zIndex: 10,
              elevation: 4,
            }}
            onPress={() => setFotoFinal(null)}
          >
            <Text style={{ fontWeight: 'bold', fontSize: 20, color: '#D32F2F', lineHeight: 20 }}>×</Text>
          </TouchableOpacity>
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
          setShowWifiModal(false);
          await enviarReceta();
          setModalExito(true);
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
          };
          const data = await AsyncStorage.getItem(`pendingRecipes_${userAlias}`);
          const borradores = data ? JSON.parse(data) : [];
          borradores.push(receta);
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
    backgroundColor: '#EEE',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 12,
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
});
