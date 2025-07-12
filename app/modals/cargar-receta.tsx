import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import NoInternetModal from '../../components/ui/NoInternetModal';
import PublishRecipeNoWifiModal from '../../components/ui/PublishRecipeNoWifiModal';
import SuccessModal from '../../components/ui/SuccessModal';
import WarningModal from '../../components/ui/WarningModal';
import { useMobileData } from '../../contexts/MobileDataContext';

// --- Parseadores extendidos y con tipado any ---
const parseIngredientes = (arr: any[] = []) =>
  arr && arr.length > 0
    ? arr.map((i: any) => ({
        nombre: i.nombre || i.name || i.ingredient || '',
        cantidad:
          i.cantidad !== undefined ? String(i.cantidad) :
          i.quantity !== undefined ? String(i.quantity) :
          '',
        unidad: i.unidad || i.unit || i.medida || ''
      }))
    : [{ nombre: '', cantidad: '', unidad: '' }];

const parsePasos = (arr: any[] = []) =>
  arr && arr.length > 0
    ? arr.map((p: any) => ({
        descripcion: p.descripcion || p.description || p.texto || '',
        media: p.media || p.image || null
      }))
    : [{ descripcion: '', media: null }];

type Step = 'titulo' | 'conflicto' | 'formulario';

export default function CargarRecetaWizard() {
  const [step, setStep] = useState<Step>('titulo');
  const [loading, setLoading] = useState(false);

  // Modales visuales
  const [modalExito, setModalExito] = useState(false);
  const [modalError, setModalError] = useState({ visible: false, mensaje: '' });
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

  const { isConnected, isWifi, allowMobileData, setAllowMobileData } = useMobileData();
  const [hideModal, setHideModal] = useState(false);
  // Cambiar la condición de shouldShowModal para usar isWifi
  const shouldShowModal = isWifi === false && !allowMobileData && !hideModal;
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [userAlias, setUserAlias] = useState<string | null>(null);

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

  const router = useRouter();

  // -------- OBTENER USUARIO LOGUEADO --------
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

  // -------- FETCH CATEGORÍAS --------
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

  // -------- FETCH INGREDIENTES --------
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
      // Buscar coincidencia exacta, case-insensitive
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

  // --------- SIEMPRE POST: CARGA UNA RECETA NUEVA ---------
  // Aunque edites datos de una receta existente, esto siempre hace POST (crear nueva)
  const enviarReceta = async () => {
    if (!descripcion.trim() || !categoria.trim() || !porciones.trim() || !titulo.trim()) {
      setModalError({ visible: true, mensaje: 'Faltan campos obligatorios' });
      return;
    }
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('Token no encontrado');

      const formData = new FormData();
      formData.append('title', titulo);
      formData.append('description', descripcion);
      formData.append('category', categoria);
      formData.append('portions', porciones);
      formData.append('ingredients', JSON.stringify(ingredientes));
      formData.append('stepsList', JSON.stringify(pasos));
      formData.append('aditionalMedia', JSON.stringify([]));
      formData.append('isVerified', 'false'); // Omitilo si tu back no lo usa

      if (fotoFinal) {
        formData.append('image', {
          uri: fotoFinal,
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
      setModalExito(true);

      // Limpiar los campos
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

  // ----------- UI -----------

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

        {/* MODALES */}
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
        <NoInternetModal
          visible={shouldShowModal}
          onContinueWithMobile={() => setAllowMobileData(true)}
          onClose={() => setHideModal(true)}
          isLanding={true}
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
        <NoInternetModal
          visible={shouldShowModal}
          onContinueWithMobile={() => setAllowMobileData(true)}
          onClose={() => setHideModal(true)}
          isLanding={true}
        />
      </View>
    );
  }

  // ---------- FORMULARIO ----------
  const handleCargarReceta = () => {
    if (!descripcion.trim() || !categoria.trim() || !porciones.trim() || !titulo.trim()) {
      setModalError({ visible: true, mensaje: 'Faltan campos obligatorios' });
      return;
    }
    if (!isWifi) {
      setShowWifiModal(true);
      return;
    }
    enviarReceta();
  };

  return (
    <ScrollView contentContainerStyle={[styles.fullScreen,{ paddingBottom: 60 }]}>
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>
      <Text style={styles.label}>Título de receta</Text>
      <TextInput
        style={[styles.input, { backgroundColor: '#F0F0F0', color: '#888' }]}
        value={titulo}
        editable={false}
      />

      <Text style={styles.label}>Descripción general</Text>
      <TextInput
        style={styles.textarea}
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Ej: Masa crocante, salsa de tomate y queso derretido..."
        multiline
      />

      {/* ----------- Picker de Categoría ----------- */}
      <Text style={styles.label}>Categoría</Text>
      <TouchableOpacity style={styles.input} onPress={() => setCategoriaModal(true)}>
        <Text style={{ color: categoria ? '#222' : '#999' }}>
          {categoria ? categoria : 'Seleccionar categoría...'}
        </Text>
      </TouchableOpacity>

      {/* ----------- Porciones ----------- */}
      <Text style={styles.label}>Porciones</Text>
      <TextInput
        style={styles.input}
        value={porciones}
        onChangeText={setPorciones}
        placeholder="Ej: 4"
        keyboardType="numeric"
      />

      {/* ----------- Ingredientes ----------- */}
      <Text style={styles.label}>Ingredientes</Text>
      {ingredientes.map((item, index) => (
        <View key={index} style={{ marginBottom: 8 }}>
          <TouchableOpacity
            style={[styles.input, { marginBottom: 6 }]}
            onPress={() => setIngredienteModalIndex(index)}
          >
            <Text style={{ color: item.nombre ? '#222' : '#999' }}>
              {item.nombre ? item.nombre : 'Seleccionar ingrediente...'}
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
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
              style={[styles.input, { flex: 1 }]}
              placeholder="Unidad"
              value={item.unidad}
              onChangeText={text => {
                const nuevos = [...ingredientes];
                nuevos[index] = { ...nuevos[index], unidad: text };
                setIngredientes(nuevos);
              }}
            />
          </View>
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
      <Text style={styles.label}>Pasos</Text>
      {pasos.map((paso, index) => (
        <View key={index} style={{ marginBottom: 8 }}>
          <TextInput
            style={styles.textarea}
            placeholder={`Paso ${index + 1}`}
            value={paso.descripcion}
            onChangeText={text => {
              const nuevos = [...pasos];
              nuevos[index] = { ...nuevos[index], descripcion: text };
              setPasos(nuevos);
            }}
            multiline
          />

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
            <Image
              source={{ uri: paso.media }}
              style={{ width: 90, height: 90, borderRadius: 10, alignSelf: 'center', marginBottom: 8 }}
            />
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
        <Image
          source={{ uri: fotoFinal }}
          style={{ width: 120, height: 120, borderRadius: 12, alignSelf: 'center', marginBottom: 8 }}
        />
      )}

      {/* Botón de envío */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleCargarReceta}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Cargar receta</Text>
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
        message="Receta cargada. Queda pendiente de aprobación."
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
      <NoInternetModal
        visible={shouldShowModal}
        onContinueWithMobile={() => setAllowMobileData(true)}
        onClose={() => setHideModal(true)}
        isLanding={true}
      />
      <PublishRecipeNoWifiModal
        visible={showWifiModal}
        onPublishWithMobile={async () => {
          setAllowMobileData(true);
          setShowWifiModal(false);
          await enviarReceta();
          setModalExito(true);
        }}
        onPublishWithWifi={async () => {
          setShowWifiModal(false);
          // Guardar la receta como borrador por usuario
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
});
