//app/modals/cargar-receta.tsx
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import IngredienteItem from '../../components/receta/IngredienteItem';
import PasoItem from '../../components/receta/PasoItem';
import BotonPrincipal from '../../components/ui/BotonPrincipal';
import SubirFoto from '../../components/ui/SubirFoto';
import SuccessModal from '../../components/ui/SuccessModal';

export default function CargarRecetaModal() {
  const router = useRouter();

  // ----------- ESTADOS -----------
  // CATEGORÍAS
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [categoriasFiltradas, setCategoriasFiltradas] = useState<any[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [errorCategorias, setErrorCategorias] = useState<string | null>(null);

  // INGREDIENTES
  const [allIngredients, setAllIngredients] = useState<any[]>([]);
  const [ingredientesSugeridos, setIngredientesSugeridos] = useState<any[]>([]);
  const [loadingIngredientes, setLoadingIngredientes] = useState(false);
  const [errorIngredientes, setErrorIngredientes] = useState<string | null>(null);

  // CAMPOS RECETA
  const [modalExitoVisible, setModalExitoVisible] = useState(false);

  const [titulo, setTitulo] = useState('');
  const [porciones, setPorciones] = useState('');
  const [categoria, setCategoria] = useState('');
  const [categoriaModal, setCategoriaModal] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  const [ingredientes, setIngredientes] = useState([{ nombre: '', cantidad: '', unidad: '' }]);
  const [ingredienteModalIndex, setIngredienteModalIndex] = useState<number | null>(null);
  const [ingredienteFiltro, setIngredienteFiltro] = useState('');

  const [pasos, setPasos] = useState([{ descripcion: '', media: null as string | null }]);
  const [fotoFinal, setFotoFinal] = useState<string | null>(null);

  // ----------- TRAER TODAS LAS CATEGORÍAS SOLO 1 VEZ -----------
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
      } catch (err) {
        setErrorCategorias('No se pudieron cargar las categorías');
      } finally {
        setLoadingCategorias(false);
      }
    };
    if (categoriaModal && allCategories.length === 0) fetchAllCategories();
    if (!categoriaModal) setCategoriaFiltro('');
  }, [categoriaModal]);

  // FILTRAR LOCALMENTE AL TIPEAR EN BUSCADOR DE CATEGORÍAS
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

  // ----------- TRAER TODOS LOS INGREDIENTES SOLO 1 VEZ -----------
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
      } catch (err) {
        setErrorIngredientes('No se pudieron cargar los ingredientes');
      } finally {
        setLoadingIngredientes(false);
      }
    };
    if (ingredienteModalIndex !== null && allIngredients.length === 0) fetchAllIngredients();
    if (ingredienteModalIndex === null) setIngredienteFiltro('');
  }, [ingredienteModalIndex]);

  // FILTRAR LOCALMENTE AL TIPEAR EN BUSCADOR DE INGREDIENTES
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

  // CRUD INGREDIENTES
  const handleIngredienteChange = (
    index: number,
    field: 'nombre' | 'cantidad' | 'unidad',
    value: string
  ) => {
    const nuevos = [...ingredientes];
    nuevos[index][field] = value;
    setIngredientes(nuevos);
  };

  const agregarIngrediente = () => {
    setIngredientes([...ingredientes, { nombre: '', cantidad: '', unidad: '' }]);
  };

  const eliminarIngrediente = (index: number) => {
    const nuevos = ingredientes.filter((_, i) => i !== index);
    setIngredientes(nuevos.length ? nuevos : [{ nombre: '', cantidad: '', unidad: '' }]);
  };

  // CRUD PASOS
  const agregarPaso = () => {
    setPasos([...pasos, { descripcion: '', media: null }]);
  };

  const eliminarPaso = (index: number) => {
    const nuevos = pasos.filter((_, i) => i !== index);
    setPasos(nuevos.length ? nuevos : [{ descripcion: '', media: null }]);
  };

  const handlePasoChange = (index: number, value: string) => {
    const nuevos = [...pasos];
    nuevos[index].descripcion = value;
    setPasos(nuevos);
  };

  const seleccionarMedia = async (index: number) => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      alert('Necesitas permisos para acceder a la galería');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.7,
    });

    if (!resultado.canceled && resultado.assets.length > 0) {
      const nuevos = [...pasos];
      nuevos[index].media = resultado.assets[0].uri;
      setPasos(nuevos);
    }
  };

  const seleccionarFotoFinal = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      alert('Permiso denegado');
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false
    });

    if (!resultado.canceled && resultado.assets.length > 0) {
      const uri = resultado.assets[0].uri;
      if (uri.startsWith('file://')) {
        setFotoFinal(uri);
      } else {
        alert('La imagen seleccionada no es válida para subir.');
      }
    }

  };

  const handleCargarReceta = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (!token) {
      alert('Token no disponible');
      return;
    }

    const formData = new FormData();

    formData.append('title', titulo);
    formData.append('category', categoria);
    formData.append('portions', porciones);
    formData.append('description', '');
    formData.append('ingredients', JSON.stringify(ingredientes));
    formData.append('stepsList', JSON.stringify(pasos.map(({ descripcion }) => ({ descripcion }))));
    formData.append('aditionalMedia', JSON.stringify([]));
 /*
    if (fotoFinal) {
      formData.append('image', {
        uri: fotoFinal,
        type: 'image/jpeg',
        name: `foto_${Date.now()}.jpg`,
      } as any);
    }
*/
    const response = await axios.post('https://bon-appetit-production.up.railway.app/api/recipies', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.status === 'success') {
      setModalExitoVisible(true);
    } else {
      alert('Error al cargar la receta');
    }
  } catch (error: any) {
    console.error('Error al cargar receta:', error?.response || error);
    alert('Ocurrió un error al enviar la receta');
  }
};


  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity style={styles.closeButton} onPress={() => router.dismiss()}>
        <Text style={styles.closeText}>×</Text>
      </TouchableOpacity>

      <View style={styles.modal}>
        <ScrollView contentContainerStyle={{ paddingTop: 16 }}>
          {/* Título */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Título de receta</Text>
            <TextInput
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ej: Milanesas de pollo"
              placeholderTextColor="#999"
            />
          </View>

          {/* Categoría */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Categoría</Text>
            <TouchableOpacity style={styles.input} onPress={() => setCategoriaModal(true)}>
              <Text style={{ color: categoria ? '#222' : '#999' }}>
                {categoria ? categoria : 'Seleccionar categoría...'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Porciones */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Cantidad de porciones</Text>
            <TextInput
              style={styles.input}
              value={porciones}
              onChangeText={setPorciones}
              placeholder="Ej: 4"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          </View>

          {/* Ingredientes */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ingredientes</Text>
            {ingredientes.map((item, index) => (
              <IngredienteItem
                key={index}
                index={index}
                nombre={item.nombre}
                cantidad={item.cantidad}
                unidad={item.unidad}
                puedeEliminar={index > 0}
                onEliminar={() => eliminarIngrediente(index)}
                onCambiarCampo={(campo, valor) => handleIngredienteChange(index, campo, valor)}
                onSeleccionarNombre={() => setIngredienteModalIndex(index)}
              />
            ))}
            <TouchableOpacity style={styles.addButton} onPress={agregarIngrediente}>
              <Text style={styles.addButtonText}>Agregar ingrediente</Text>
            </TouchableOpacity>
          </View>

          {/* Pasos */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción de la receta</Text>
            {pasos.map((paso, index) => (
              <PasoItem
                key={index}
                index={index}
                descripcion={paso.descripcion}
                media={paso.media}
                puedeEliminar={index > 0}
                onEliminar={() => eliminarPaso(index)}
                onChangeDescripcion={(text) => handlePasoChange(index, text)}
                onSeleccionarMedia={() => seleccionarMedia(index)}
              />
            ))}
            <TouchableOpacity style={styles.addButton} onPress={agregarPaso}>
              <Text style={styles.addButtonText}>Añadir paso</Text>
            </TouchableOpacity>
          </View>

          {/* Foto final + Botón */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Agrega foto/s del plato terminado</Text>
            <SubirFoto onPress={seleccionarFotoFinal} filename={fotoFinal?.split('/').pop() || null} />
            <BotonPrincipal onPress={handleCargarReceta} />
          </View>
        </ScrollView>
      </View>

      {/* MODAL DE CATEGORÍAS */}
      <Modal visible={categoriaModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setCategoriaModal(false)} activeOpacity={1}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar categoría..."
              value={categoriaFiltro}
              onChangeText={setCategoriaFiltro}
              autoFocus
            />
            {loadingCategorias && <Text>Cargando categorías...</Text>}
            {errorCategorias && <Text style={{ color: 'red' }}>{errorCategorias}</Text>}
            <FlatList
              data={categoriasFiltradas}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleCategoriaSelect(item.name)}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="always"
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL DE INGREDIENTES */}
      <Modal visible={ingredienteModalIndex !== null} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setIngredienteModalIndex(null)} activeOpacity={1}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ingrediente..."
              value={ingredienteFiltro}
              onChangeText={setIngredienteFiltro}
              autoFocus
            />
            {loadingIngredientes && <Text>Cargando ingredientes...</Text>}
            {errorIngredientes && <Text style={{ color: 'red' }}>{errorIngredientes}</Text>}
            <FlatList
              data={ingredientesSugeridos}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleIngredienteSelect(item.name)}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                !loadingIngredientes && ingredienteFiltro.trim() !== ''
                  ? <Text>No hay ingredientes</Text>
                  : null
              }
              keyboardShouldPersistTaps="always"
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <SuccessModal
        visible={modalExitoVisible}
        onClose={() => {
          setModalExitoVisible(false);
          router.push('/(tabs)/agregar');
        }}
        title={'¡Receta cargada!'}
        message={'Tu receta se cargó correctamente y se encuentra pendiente de aprobación.'}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'center', alignItems: 'center' },
  modal: { backgroundColor: 'white', borderRadius: 16, paddingHorizontal: 24, paddingBottom: 24, width: '95%', maxHeight: '90%' },
  closeButton: { position: 'absolute', top: '6%', right: '6%', backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 2, elevation: 5, zIndex: 100 },
  closeText: { fontSize: 24, fontWeight: 'bold' },
  formGroup: { marginBottom: 16 },
  label: { fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, height: 48, paddingHorizontal: 12, justifyContent: 'center', fontSize: 16 },
  textarea: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, minHeight: 100, textAlignVertical: 'top' },
  ingredienteGroup: { marginBottom: 16, backgroundColor: '#FAFAFA', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#EEE' },
  ingredienteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  removeButton: { fontSize: 20, fontWeight: 'bold', color: '#C00', paddingHorizontal: 8 },
  pasoGroup: { marginBottom: 16, backgroundColor: '#FAFAFA', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#EEE' },
  pasoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subirBtn: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, marginTop: 8 },
  subirBtnText: { color: '#333', fontSize: 14 },
  filename: { fontSize: 12, color: '#666', marginTop: 4 },
  addButton: { backgroundColor: '#EEE', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', alignSelf: 'flex-start', marginTop: 8 },
  addButtonText: { fontWeight: 'bold', color: '#333' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000055' },
  modalContent: { backgroundColor: '#FFF', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '60%' },
  searchInput: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, paddingHorizontal: 12, height: 48, marginBottom: 12 },
  modalItem: { paddingVertical: 14, borderBottomColor: '#EEE', borderBottomWidth: 1 },
  modalItemText: { fontSize: 16 },
});
