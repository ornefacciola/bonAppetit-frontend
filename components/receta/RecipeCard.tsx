import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


export interface RecipeCardProps {
  id: string;
  title: string;
  category: string;
  author: string;
  imageUrl: string;
  rating: number;
  onPress?: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  variant?: 'default' | 'compact';
  userRole?: string | null;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  id,
  title,
  category,
  author,
  imageUrl,
  rating,
  onPress,
  onToggleFavorite,
  isFavorite,
  variant = 'default', // valor por defecto
  userRole,
}) => {
  const router = useRouter();
  const isCompact = variant === 'compact';

  // Debug: log del userRole
  console.log('RecipeCard userRole:', userRole, 'isGuest:', userRole === 'guest');

  const handlePress = () => {
    if (onPress) {
      onPress(id);
    } else {
      router.push({
        pathname: '/receta/[id]',
        params: { id }
      } as any);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, isCompact && styles.cardCompact]}
      onPress={handlePress}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, isCompact && styles.imageCompact]}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.image, isCompact && styles.imageCompact, styles.noImage]}>
          <Ionicons name="restaurant-outline" size={48} color="#ccc" />
        </View>
      )}
      {userRole !== 'guest' && (
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => onToggleFavorite(id)}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={24}
            color={isFavorite ? '#FF6347' : '#FFF'}
          />
        </TouchableOpacity>
      )}
      <View style={styles.content}>
        <View style={styles.titleRatingContainer}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{rating.toFixed(1)}</Text>
          </View>
        </View>
        <Text style={styles.category}>{category}</Text>
        <Text style={styles.author}>by @{author}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
    width: 280,
  },
  cardCompact: {
    width: '100%',         // ocupa todo el ancho disponible
    alignSelf: 'stretch',  // estira la card
    marginHorizontal: 0,   // sin margen lateral
  },
  image: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imageCompact: {
    height: 140, // más bajo para compacta
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 6,
    zIndex: 1,
  },
  content: {
    padding: 16,
  },
  titleRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    flexShrink: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  category: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  author: {
    fontSize: 14,
    color: '#999',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default RecipeCard;
