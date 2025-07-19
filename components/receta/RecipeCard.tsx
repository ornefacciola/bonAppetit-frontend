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
  style?: any;
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
  style,
}) => {
  const router = useRouter();
  const isCompact = variant === 'compact';

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
      style={[styles.card, isCompact && styles.cardCompact, style]}
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
            size={21}
            color={isFavorite ? '#FF6347' : '#FFF'}
          />
        </TouchableOpacity>
      )}
      <View style={styles.content}>
        <View style={styles.titleRatingContainer}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={16} color="#F2B90D" />
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
    marginHorizontal: 7,
    marginBottom: 9,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
    width: 250, // o '100%' si quieres que se expanda
  },
  cardCompact: {
    width: '100%',
    maxWidth: 380 ,
    alignSelf: 'center',
    marginHorizontal: 0,
  },
  image: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imageCompact: {
    height: 95, // Usa un valor en px para evitar problemas
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
    padding: 17,
    paddingBottom: 14,
    paddingTop: 9,
  },
  titleRatingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 1  ,
    width: '100%',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    flexShrink: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8
  },
  rating: { 
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  category: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  author: {
    fontSize: 12,
    color: '#999',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});

export default RecipeCard;
