//app/cargar-receta.tsx
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

import { ProtectedPage } from '@/components/ProtectedPage';

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

  // Estados de error para validación
  const [errores, setErrores] = useState({
    titulo: false,
    categoria: false,
    porciones: false,
    ingredientes: [] as boolean[], // uno por ingrediente
    pasos: [] as boolean[], // uno por paso
  });

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

  // Validación al enviar
  const validarCampos = () => {
    const err = {
      titulo: !titulo.trim(),
      categoria: !categoria,
      porciones: !porciones.trim(),
      ingredientes: ingredientes.map(ing => !ing.nombre || !ing.cantidad || !ing.unidad),
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

  return (
    <ProtectedPage pageName="cargar-receta">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>

            <Text style={styles.label}>
              Título de receta <Text style={{ color: 'red' }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errores.titulo && { borderColor: 'red' }]}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ej: Milanesas de pollo"
            />
            {errores.titulo && <Text style={styles.errorText}>Este campo es obligatorio</Text>}

            <Text style={styles.label}>
              Categoría <Text style={{ color: 'red' }}>*</Text>
            </Text>
            <View style={[styles.pickerWrapper, errores.categoria && { borderColor: 'red', borderWidth: 1 }]}>
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
            {errores.categoria && <Text style={styles.errorText}>Este campo es obligatorio</Text>}

            <Text style={styles.label}>
              Cantidad de porciones <Text style={{ color: 'red' }}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errores.porciones && { borderColor: 'red' }]}
              value={porciones}
              onChangeText={setPorciones}
              placeholder="Ej: 4"
              keyboardType="numeric"
            />
            {errores.porciones && <Text style={styles.errorText}>Este campo es obligatorio</Text>}

            <Text style={styles.label}>
              Ingredientes <Text style={{ color: 'red' }}>*</Text>
            </Text>
            {ingredientes.map((ing, i) => (
              <View key={i} style={styles.ingredienteContainer}>
                <View style={[styles.pickerWrapper, errores.ingredientes[i] && { borderColor: 'red', borderWidth: 1 }]}>
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
                  style={[styles.input, errores.ingredientes[i] && { borderColor: 'red' }]}
                  placeholder="Cantidad"
                  keyboardType="numeric"
                  value={ing.cantidad}
                  onChangeText={(text) => actualizarIngrediente(i, 'cantidad', text)}
                />
                <TextInput
                  style={[styles.input, errores.ingredientes[i] && { borderColor: 'red' }]}
                  placeholder="Unidad"
                  value={ing.unidad}
                  onChangeText={(text) => actualizarIngrediente(i, 'unidad', text)}
                />
                {errores.ingredientes[i] && <Text style={styles.errorText}>Completa todos los campos</Text>}
              </View>
            ))}
            <TouchableOpacity onPress={agregarIngrediente} style={styles.secondaryButton}>
              <Text>➕ Añadir ingrediente</Text>
            </TouchableOpacity>

            <Text style={styles.label}>
              Descripción de la receta <Text style={{ color: 'red' }}>*</Text>
            </Text>
            {pasos.map((paso, i) => (
              <View key={i}>
                <TextInput
                  style={[styles.input, errores.pasos[i] && { borderColor: 'red' }]}
                  placeholder={`Paso ${i + 1}`}
                  value={paso.descripcion}
                  onChangeText={(text) => actualizarPaso(i, text)}
                  multiline
                />
                {errores.pasos[i] && <Text style={styles.errorText}>Este campo es obligatorio</Text>}
              </View>
            ))}
            <TouchableOpacity onPress={agregarPaso} style={styles.secondaryButton}>
              <Text>➕ Añadir paso</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Agrega foto/s del plato terminado</Text>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text>📷 Subir foto</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitButton} onPress={() => {
              if (!validarCampos()) return;
              // ... lógica de envío ...
            }}>
              <Text style={styles.submitText}>Cargar Receta</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </ProtectedPage>
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
    backgroundColor: '#F6F6F6',
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 2,
    marginLeft: 2,
  },
});
