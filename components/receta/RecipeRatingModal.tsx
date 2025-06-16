import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface RecipeRatingModalProps {
  visible: boolean;
  onClose: () => void;
  recipeTitle: string;
  onSubmit?: (rating: number, comment: string) => Promise<void> | void;
}

export const RecipeRatingModal: React.FC<RecipeRatingModalProps> = ({ visible, onClose, recipeTitle, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleStarPress = (value: number) => {
    setRating(value);
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(rating, comment);
      }
      setSuccess(true);
    } catch (e) {
      // handle error if needed
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setLoading(false);
    setSuccess(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>

          {/* Loading state */}
          {loading ? (
            <View style={styles.centeredContent}>
              <ActivityIndicator size="large" color="#055B49" />
              <Text style={styles.loadingText}>Cargando valoración...</Text>
            </View>
          ) : success ? (
            <View style={styles.centeredContent}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={64} color="#8BC34A" />
              </View>
              <Text style={styles.successTitle}>¡Bien hecho!</Text>
              <Text style={styles.successMsg}>
                Tu comentario está pendiente de aprobación
              </Text>
              <TouchableOpacity style={styles.successBtn} onPress={handleClose}>
                <Text style={styles.successBtnText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.title}>Dejá tu opinión</Text>
              <Text style={styles.subtitle}>Califica a {recipeTitle}</Text>
              {/* Star rating */}
              <View style={styles.starsRow}>
                {[1,2,3,4,5].map((val) => (
                  <TouchableOpacity key={val} onPress={() => handleStarPress(val)}>
                    <Ionicons
                      name={val <= rating ? 'star' : 'star-outline'}
                      size={36}
                      color={val <= rating ? '#FFD700' : '#BDBDBD'}
                      style={{ marginHorizontal: 2 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              {/* Comment box */}
              <TextInput
                style={styles.textarea}
                placeholder="Escribe tu comentario..."
                placeholderTextColor="#999"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
              />
              {/* Buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.acceptBtn, { opacity: rating === 0 ? 0.5 : 1 }]}
                  onPress={handleAccept}
                  disabled={rating === 0}
                >
                  <Text style={styles.acceptBtnText}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 8,
    color: '#222',
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  textarea: {
    width: '100%',
    minHeight: 70,
    borderColor: '#BDBDBD',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#333',
    marginBottom: 20,
    backgroundColor: '#F8F8F8',
    textAlignVertical: 'top',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    borderWidth: 1,
    borderColor: '#055B49',
    borderRadius: 8,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#055B49',
    fontWeight: 'bold',
    fontSize: 16,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: '#055B49',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 180,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  successIconContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMsg: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  successBtn: {
    backgroundColor: '#8BC34A',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  successBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 