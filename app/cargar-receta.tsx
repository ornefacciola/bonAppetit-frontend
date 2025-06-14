import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Tipos
type CampoIngrediente = 'nombre' | 'cantidad' | 'unidad';

type Ingrediente = {
  nombre: string;
  cantidad: string;
  unidad: string;
};

type Paso = {
  descripcion: string;
};

export default function CargarRecetaModal() {
  const router = useRouter();

  const categorias = ['Plato principal', 'Postre', 'Entrada', 'Bebida'];
  const ingredientesDisponibles = ['Carne', 'Papas', 'Arroz', 'Tomate'];

  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('');
  const [porciones, setPorciones] = useState('');
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([
    { nombre: '', cantidad: '', unidad: '' },
  ]);
  const [pasos, setPasos] = useState<Paso[]>([{ descripcion: '' }]);

  const agregarIngrediente = () => {
    setIngredientes([...ingredientes, { nombre: '', cantidad: '', unidad: '' }]);
  };

  const actualizarIngrediente = (
    index: number,
    field: CampoIngrediente,
    value: string
  ) => {
    const nuevos = [...ingredientes];
    nuevos[index][field] = value;
    setIngredientes(nuevos);
  };

  const agregarPaso = () => {
    setPasos([...pasos, { descripcion: '' }]);
  };

  const actualizarPaso = (index: number, value: string) => {
    const nuevos = [...pasos];
    nuevos[index].descripcion = value;
    setPasos(nuevos);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Título de receta</Text>
          <TextInput
            style={styles.input}
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ej: Milanesas de pollo"
          />

          <Text style={styles.label}>Categoría</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={categoria}
              onValueChange={setCategoria}
              style={styles.picker}
            >
              <Picker.Item label="Seleccionar categoría..." value="" />
              {categorias.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          </View>

          <Text style={styles.label}>Cantidad de porciones</Text>
          <TextInput
            style={styles.input}
            value={porciones}
            onChangeText={setPorciones}
            placeholder="Ej: 4"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Ingredientes</Text>
          {ingredientes.map((ing, i) => (
            <View key={i} style={styles.ingredienteContainer}>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={ing.nombre}
                  onValueChange={(text) => actualizarIngrediente(i, 'nombre', text)}
                  style={styles.picker}
                >
                  <Picker.Item label="Seleccionar ingrediente..." value="" />
                  {ingredientesDisponibles.map((op) => (
                    <Picker.Item key={op} label={op} value={op} />
                  ))}
                </Picker>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Cantidad"
                keyboardType="numeric"
                value={ing.cantidad}
                onChangeText={(text) => actualizarIngrediente(i, 'cantidad', text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Unidad"
                value={ing.unidad}
                onChangeText={(text) => actualizarIngrediente(i, 'unidad', text)}
              />
            </View>
          ))}
          <TouchableOpacity onPress={agregarIngrediente} style={styles.secondaryButton}>
            <Text>➕ Añadir ingrediente</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Descripción de la receta</Text>
          {pasos.map((paso, i) => (
            <TextInput
              key={i}
              style={styles.input}
              placeholder={`Paso ${i + 1}`}
              value={paso.descripcion}
              onChangeText={(text) => actualizarPaso(i, text)}
              multiline
            />
          ))}
          <TouchableOpacity onPress={agregarPaso} style={styles.secondaryButton}>
            <Text>➕ Añadir paso</Text>
          </TouchableOpacity>

          <Text style={styles.label}>Agrega foto/s del plato terminado</Text>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text>📷 Subir foto</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitText}>Cargar Receta</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '95%',
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  closeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  label: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  picker: {
    height: Platform.OS === 'ios' ? 180 : 50,
    width: '100%',
  },
  ingredienteContainer: {
    marginBottom: 12,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginVertical: 10,
  },
  submitButton: {
    backgroundColor: '#025E45',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
