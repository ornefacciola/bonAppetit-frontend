import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SuccessModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity onPress={onClose} style={styles.close}>
            <Text style={{ fontSize: 20 }}>✕</Text>
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <View style={styles.checkIcon}>
              <Text style={styles.checkText}>✔</Text>
            </View>
          </View>

          <Text style={styles.title}>¡Bien hecho!</Text>
          <Text style={styles.message}>
            Tu receta está pendiente de aprobación{'\n'}
            Puedes verla en tu perfil
          </Text>

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    backgroundColor: '#F6F6F6',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  close: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  iconContainer: {
    marginBottom: 20,
  },
  checkIcon: {
    backgroundColor: '#8BC34A',
    borderRadius: 50,
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 36,
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    color: '#333',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#8BC34A',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
