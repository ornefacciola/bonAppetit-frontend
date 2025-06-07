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
  descripcion: string;
  media?: string | null;
  puedeEliminar: boolean;
  onEliminar: () => void;
  onChangeDescripcion: (text: string) => void;
  onSeleccionarMedia: () => void;
}

export default function PasoItem({
  index,
  descripcion,
  media,
  puedeEliminar,
  onEliminar,
  onChangeDescripcion,
  onSeleccionarMedia,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Paso {index + 1}</Text>
        {puedeEliminar && (
          <TouchableOpacity onPress={onEliminar}>
            <Text style={styles.eliminar}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={styles.textarea}
        multiline
        numberOfLines={4}
        placeholder="Describe este paso..."
        placeholderTextColor="#999"
        value={descripcion}
        onChangeText={onChangeDescripcion}
      />

      <TouchableOpacity style={styles.subirBtn} onPress={onSeleccionarMedia}>
        <Text style={styles.subirBtnText}>📤 Subir foto o video</Text>
      </TouchableOpacity>

      {media && (
        <Text style={styles.filename}>
          Archivo seleccionado: {media.split('/').pop()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  label: {
    fontWeight: '600',
    fontSize: 16,
  },
  eliminar: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C00',
    paddingHorizontal: 8,
  },
  textarea: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  subirBtn: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  subirBtnText: {
    color: '#333',
    fontSize: 14,
  },
  filename: {
    fontSize: 12,
    color: '#666',
  },
});
