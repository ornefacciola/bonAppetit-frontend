import AsyncStorage from '@react-native-async-storage/async-storage';

export const toggleFavorite = async (recipeId, isFavorite, setFavoriteState) => {
  const token = await AsyncStorage.getItem('authToken');
  if (!token) return;

  try {
    const url = `https://bon-appetit-production.up.railway.app/api/favourite-recipies/${recipeId}/`;
    const method = isFavorite ? 'DELETE' : 'POST';
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (response.ok && data.status === 'success') {
      setFavoriteState((prev) => ({ ...prev, [recipeId]: !isFavorite }));
    } else {
      alert('Error al actualizar favorito');
    }
  } catch (e) {
    alert('Error de red al actualizar favorito');
  }
}; 