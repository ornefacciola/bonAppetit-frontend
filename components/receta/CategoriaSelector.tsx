import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  value: string;
  onSelect: (categoria: string) => void;
  categorias?: string[];
}

const DEFAULT_CATEGORIAS = [
  'Postres', 'Ensaladas', 'Milanesas', 'Sopas', 'Bebidas', 'Pastas'
];

export default function CategoriaSelector({
  value,
  onSelect,
  categorias = DEFAULT_CATEGORIAS,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [filtro, setFiltro] = useState('');

  const categoriasFiltradas = categorias.filter((item) =>
    item.toLowerCase().includes(filtro.toLowerCase())
  );

  const handleSelect = (item: string) => {
    onSelect(item);
    setModalVisible(false);
    setFiltro('');
  };

  return (
    <View>
      <TouchableOpacity style={styles.input} onPress={() => setModalVisible(true)}>
        <Text style={{ color: value ? '#000' : '#999' }}>
          {value || 'Seleccionar categoría...'}
        </Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
          activeOpacity={1}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar categoría..."
              placeholderTextColor="#999"
              value={filtro}
              onChangeText={setFiltro}
            />
            <FlatList
              data={categoriasFiltradas}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    height: 48,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000055',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
  },
  modalItemText: {
    fontSize: 16,
  },
});
