import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { useConnection } from '../../contexts/ConnectionContext';

const GlobalConnectionModal: React.FC = () => {
  const { isConnected, type } = useConnection();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isConnected) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isConnected]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.centeredContent}>
            <MaterialIcons name="signal-wifi-off" size={64} color="#222" style={styles.icon} />
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