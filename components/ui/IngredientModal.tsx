import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface IngredientModalProps {
  visible: boolean;
  ingredient: string | null;
  onClose: () => void;
  onInclude: (ingredient: string) => void;
  onExclude: (ingredient: string) => void;
}

export const IngredientModal: React.FC<IngredientModalProps> = ({
  visible,
  ingredient,
  onClose,
  onInclude,
  onExclude
}) => {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
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

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={StyleSheet.absoluteFillObject}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>{ingredient}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#025E45' }]}
              onPress={() => {
                if (ingredient) onInclude(ingredient);
                onClose();
              }}
            >
              <Text style={styles.actionText}>Incluir a la receta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#D32F2F' }]}
              onPress={() => {
                if (ingredient) onExclude(ingredient);
                onClose();
              }}
            >
              <Text style={styles.actionText}>Excluir de la receta</Text>
            </TouchableOpacity>
          </View>
          <Pressable style={styles.closeIcon} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#666" />
          </Pressable>
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
    backgroundColor: 'white',
    padding: 24,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  title: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: 12,
    borderRadius: 8,
  },
  actionText: {
    color: 'white'
  },
  closeIcon: {
    marginTop: 16,
    alignItems: 'center'
  }
});
