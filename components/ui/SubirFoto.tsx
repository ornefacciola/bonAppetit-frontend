import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  label?: string;
  onPress: () => void;
  filename?: string | null;
}

export default function SubirFoto({ label = 'Subir foto', onPress, filename }: Props) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.text}>📤 {label}</Text>
      </TouchableOpacity>
      {filename && (
        <Text style={styles.filename}>Archivo: {filename}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  button: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  text: {
    color: '#333',
    fontSize: 14,
  },
  filename: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
  },
});
