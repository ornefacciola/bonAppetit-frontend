import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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

import CategoriaSelector from '../../components/receta/CategoriaSelector';
import IngredienteItem from '../../components/receta/IngredienteItem';
import PasoItem from '../../components/receta/PasoItem';
import BotonPrincipal from '../../components/ui/BotonPrincipal';
import SubirFoto from '../../components/ui/SubirFoto';
import SuccessModal from '../../components/ui/SuccessModal';


const CATEGORIAS = ['Postres', 'Ensaladas', 'Milanesas', 'Sopas', 'Bebidas', 'Pastas'];
const INGREDIENTES_DISPONIBLES = [
  'Harina', 'Leche', 'Huevos', 'Pollo', 'Pan rallado',
  'Sal', 'Azúcar', 'Queso', 'Carne',
];


export default function CargarRecetaModal() {
  const router = useRouter();

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

  // --- Categoría ---
  const categoriasFiltradas = CATEGORIAS.filter((item) =>
    item.toLowerCase().includes(categoriaFiltro.toLowerCase())
  );

  const handleCategoriaSelect = (item: string) => {
    setCategoria(item);
    setCategoriaModal(false);
    setCategoriaFiltro('');
  };

  // --- Ingredientes ---
  const ingredientesFiltrados = INGREDIENTES_DISPONIBLES.filter((item) =>
    item.toLowerCase().includes(ingredienteFiltro.toLowerCase())
  );

  const handleIngredienteSelect = (item: string) => {
    if (ingredienteModalIndex !== null) {
      const nuevos = [...ingredientes];
      nuevos[ingredienteModalIndex].nombre = item;
      setIngredientes(nuevos);
      setIngredienteModalIndex(null);
      setIngredienteFiltro('');
    }
  };

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

  // --- Pasos ---
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
    });

    if (!resultado.canceled && resultado.assets.length > 0) {
      setFotoFinal(resultado.assets[0].uri);
    }
  };

  const handleCargarReceta = () => {
    // Acá se arma el JSON para guardar
    const receta = {
      titulo,
      categoria,
      porciones,
      ingredientes,
      pasos,
      fotoFinal,
    };
    console.log('Receta:', receta);
    setModalExitoVisible(true);
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Categoría</Text>
            <CategoriaSelector value={categoria} onSelect={setCategoria} />
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

      {/* MODALES */}
      <Modal visible={categoriaModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setCategoriaModal(false)} activeOpacity={1}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar categoría..."
              value={categoriaFiltro}
              onChangeText={setCategoriaFiltro}
            />
            <FlatList
              data={categoriasFiltradas}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleCategoriaSelect(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={ingredienteModalIndex !== null} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setIngredienteModalIndex(null)} activeOpacity={1}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar ingrediente..."
              value={ingredienteFiltro}
              onChangeText={setIngredienteFiltro}
            />
            <FlatList
              data={ingredientesFiltrados}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => handleIngredienteSelect(item)}>
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <SuccessModal
    visible={modalExitoVisible}
    onClose={() => {
      setModalExitoVisible(false);
      router.push('/(tabs)/agregar'); // o donde quieras redirigir
    }}
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
