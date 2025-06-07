import React from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Props {
  index: number;
  nombre: string;
  cantidad: string;
  unidad: string;
  puedeEliminar: boolean;
  onEliminar: () => void;
  onCambiarCampo: (campo: 'nombre' | 'cantidad' | 'unidad', valor: string) => void;
  onSeleccionarNombre: () => void;
}

export default function IngredienteItem({
  index,
  nombre,
  cantidad,
  unidad,
  puedeEliminar,
  onEliminar,
  onCambiarCampo,
  onSeleccionarNombre,
}: Props) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.header}>
        <Text style={styles.label}>Ingrediente {index + 1}</Text>
        {puedeEliminar && (
          <TouchableOpacity onPress={onEliminar}>
            <Text style={styles.eliminar}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.input} onPress={onSeleccionarNombre}>
        <Text style={{ color: nombre ? '#000' : '#999' }}>
          {nombre || 'Seleccionar ingrediente...'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.label}>Cantidad</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: 2"
        placeholderTextColor="#999"
        keyboardType="numeric"
        value={cantidad}
        onChangeText={(text) => onCambiarCampo('cantidad', text)}
      />

      <Text style={styles.label}>Unidad</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: tazas"
        placeholderTextColor="#999"
        value={unidad}
        onChangeText={(text) => onCambiarCampo('unidad', text)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eliminar: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C00',
    paddingHorizontal: 8,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
    fontSize: 16,
    marginBottom: 12,
  },
});
