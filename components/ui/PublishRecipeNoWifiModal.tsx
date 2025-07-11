import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface PublishRecipeNoWifiModalProps {
  visible: boolean;
  onPublishWithMobile: () => void;
  onPublishWithWifi: () => void;
  onClose?: () => void;
}

const PublishRecipeNoWifiModal: React.FC<PublishRecipeNoWifiModalProps> = ({ visible, onPublishWithMobile, onPublishWithWifi, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>!</Text>
          </View>
          <Text style={styles.title}>Atención</Text>
          <Text style={styles.message}>Parece que no estás conectado al WiFi</Text>
          <TouchableOpacity style={styles.grayButton} onPress={onPublishWithWifi}>
            <Text style={styles.grayButtonText}>Publicar cuando tenga WiFi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.orangeButton} onPress={onPublishWithMobile}>
            <Text style={styles.orangeButtonText}>Publicar con datos móviles</Text>
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
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  closeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#888',
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
    marginBottom: 12,
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

export default PublishRecipeNoWifiModal; 