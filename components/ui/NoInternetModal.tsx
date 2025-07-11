import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface NoInternetModalProps {
  visible: boolean;
  onContinueWithMobile: () => void;
  onLogout?: () => void;
  onClose?: () => void;
  isLanding?: boolean;
}

const NoInternetModal: React.FC<NoInternetModalProps> = ({ visible, onContinueWithMobile, onLogout, onClose, isLanding }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>!</Text>
          </View>
          <Text style={styles.title}>Sin conexión</Text>
          <Text style={styles.message}>
            Parece que perdiste la conexión a internet. ¿Deseás continuar usando datos móviles?
          </Text>
          <TouchableOpacity style={styles.orangeButton} onPress={onContinueWithMobile}>
            <Text style={styles.orangeButtonText}>Continuar con datos móviles</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.grayButton}
            disabled={isLanding ? false : undefined}
            onPress={() => {
              if (isLanding && onClose) onClose();
              else if (onLogout) onLogout();
            }}
          >
            <Text style={styles.grayButtonText}>{isLanding ? 'Cerrar' : 'Cerrar sesión'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 5,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F59C1D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#222',
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    marginBottom: 24,
  },
  grayButton: {
    backgroundColor: '#888',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  grayButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  orangeButton: {
    backgroundColor: '#F59C1D',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  orangeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default NoInternetModal; 