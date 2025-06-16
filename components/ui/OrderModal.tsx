import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  selected: string;
  onSelect: (val: string) => void;
  onClose: () => void;
  options: { label: string; value: string }[];
}

export const OrderModal: React.FC<Props> = ({ visible, selected, onSelect, onClose, options }) => {
  const [tempSelected, setTempSelected] = useState(selected);
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      setTempSelected(selected); // reiniciar selección temporal al abrir
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleApply = () => {
    onSelect(tempSelected); // aplicar la selección
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFillObject}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Ordenar</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {options.map((option) => (
            <Pressable
              key={option.value}
              style={[styles.optionButton, tempSelected === option.value && styles.optionSelected]}
              onPress={() => setTempSelected(option.value)}
            >
              <Text>{option.label}</Text>
            </Pressable>
          ))}

          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Aplicar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontWeight: '600',
    fontSize: 18,
  },
  optionButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F3F3',
    marginBottom: 10,
  },
  optionSelected: {
    backgroundColor: '#A7E2D2',
  },
  applyButton: {
    marginTop: 16,
    backgroundColor: '#025E45',
    padding: 12,
    borderRadius: 8,
  },
  applyButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '600',
  },
});
