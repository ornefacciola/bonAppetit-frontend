import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useConnection } from '../../contexts/ConnectionContext';

const GlobalConnectionModal: React.FC = () => {
  const { isConnected } = useConnection();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!isConnected);
  }, [isConnected]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setVisible(false)}>
            <MaterialCommunityIcons name="close" size={28} color="#222" />
          </TouchableOpacity>
          <View style={styles.centeredContent}>
            <MaterialCommunityIcons name="wifi-off" size={64} color="#222" style={styles.icon} />
            <Text style={styles.title}>No hay conexión a Internet</Text>
            <Text style={styles.subtitle}>
              Parece que no tenés conexión.{"\n"}
              <Text style={styles.bold}>Conectate a una red Wi-Fi o utiliza datos móviles</Text>
            </Text>
          </View>
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
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#F6F6F6',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 2,
    backgroundColor: 'rgba(230,230,230,0.9)',
    borderRadius: 16,
    padding: 2,
  },
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 180,
  },
  icon: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
    color: '#222',
  },
});

export default GlobalConnectionModal;
