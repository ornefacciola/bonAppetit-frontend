import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface Props {
  label?: string;
  onPress: () => void;
}

export default function BotonPrincipal({ label = 'Cargar Receta', onPress }: Props) {
  return (
    <TouchableOpacity style={styles.boton} onPress={onPress}>
      <Text style={styles.texto}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  boton: {
    backgroundColor: '#006644',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  texto: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
