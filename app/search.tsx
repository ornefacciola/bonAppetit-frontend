// app/search.tsx
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

import RecipeCard from '@/components/receta/RecipeCard';
import { ThemedView } from '@/components/ThemedView';
import { IngredientModal } from '@/components/ui/IngredientModal';
import { OrderModal } from '@/components/ui/OrderModal';
import { SearchBar } from '@/components/ui/SearchBar';
import { SearchTabs } from '@/components/ui/SearchTabs';
import { useRouter } from 'expo-router';

const ORDER_OPTIONS = [
    { label: "Más nuevo a más viejo", value: "publishedDate_desc" },
    { label: "Más viejo a más nuevo", value: "publishedDate_asc" },
    { label: "Alfabéticamente (A a Z)", value: "title_asc" },
    { label: "Alfabéticamente (Z a A)", value: "title_desc" },
];

export default function SearchScreen() {
    const router = useRouter();
    const [searchType, setSearchType] = useState<'receta' | 'ingredientes' | 'usuarios'>('receta');
    const [searchText, setSearchText] = useState('');
    const [orderModalVisible, setOrderModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState('publishedDate_desc');
    const [ingredientResults, setIngredientResults] = useState<any[]>([]);
    const [allIngredients, setAllIngredients] = useState<any[]>([]);
    const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
    const [ingredientModalVisible, setIngredientModalVisible] = useState(false);
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [includeIngredients, setIncludeIngredients] = useState<string[]>([]);
    const [excludeIngredients, setExcludeIngredients] = useState<string[]>([]);
    const [showIngredientUI, setShowIngredientUI] = useState(true);

    useEffect(() => {
        const fetchIngredients = async () => {
            try {
                const res = await fetch('https://bon-appetit-production.up.railway.app/api/ingredients');
                const data = await res.json();
                if (data.status === 'success') {
                    setAllIngredients(data.ingredients);
                    setIngredientResults(data.ingredients);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchIngredients();
    }, []);

    const handleIngredientSearch = (text: string) => {
        setSearchText(text);
        const filtered = allIngredients.filter((ing: any) =>
            ing.name.toLowerCase().includes(text.toLowerCase())
        );
        setIngredientResults(filtered);
    };

    const handleIngredientSelect = (ingredient: string) => {
        setSelectedIngredient(ingredient);
        setIngredientModalVisible(true);
        setDropdownVisible(false);
    };

    const handleSearchTabChange = (type: 'receta' | 'ingredientes' | 'usuarios') => {
        setSearchText('');
        setSearchType(type);
        setResults([]);
        setDropdownVisible(false);
        setShowIngredientUI(true);
    };

    const handleApplyFilters = async () => {
        const [sortBy, order] = selectedOrder.split('_');
        const params = new URLSearchParams({ sortBy, order });

        if (includeIngredients.length > 0) params.append('contains', includeIngredients.join(','));
        if (excludeIngredients.length > 0) params.append('notContains', excludeIngredients.join(','));

        try {
            const res = await fetch(`https://bon-appetit-production.up.railway.app/api/recipies?${params.toString()}`);
            const data = await res.json();
            if (data.status === 'success') {
                setResults(data.payload);
                setShowIngredientUI(false);
                setSearchText('');
                setDropdownVisible(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const [sortBy, order] = selectedOrder.split('_');
                const params = new URLSearchParams({ sortBy, order });

                if (searchText) {
                    if (searchType === 'receta') {
                        params.append('title', searchText);
                    } else if (searchType === 'usuarios') {
                        params.append('user', searchText);
                    }
                }

                if (searchType === 'ingredientes') return;

                const res = await fetch(`https://bon-appetit-production.up.railway.app/api/recipies?${params.toString()}`);
                const data = await res.json();
                if (data.status === 'success') {
                    setResults(data.payload);
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchResults();
    }, [searchText, selectedOrder, searchType]);

    return (
        <ThemedView style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="arrow-back" size={24} onPress={() => router.back()} />
                <Text style={styles.title}>Buscador</Text>
            </View>

            <View style={{ position: 'relative', zIndex: 10 }}>
                <SearchBar
                    value={searchText}
                    onChangeText={searchType === 'ingredientes' ? handleIngredientSearch : setSearchText}
                    placeholder={`Buscar recetas por ${searchType == 'receta' ? 'nombre' : searchType}`}
                    onFocus={() => {
                        if (searchType === 'ingredientes') {
                          setDropdownVisible(prev => !prev);
                        }
                      }}
                />
            </View>

            {searchType === 'ingredientes' && dropdownVisible && (
                <View style={{ position: 'absolute', top: 130, left: 24, right: 24, zIndex: 9999, elevation: 10 }}>
                    <ScrollView
                        style={styles.dropdown}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                        scrollEnabled
                    >
                        {ingredientResults.length > 0 ? (
                            ingredientResults.map((item) => (
                                <TouchableOpacity
                                    key={item._id}
                                    onPress={() => handleIngredientSelect(item.name)}
                                    style={styles.dropdownItem}
                                >
                                    <Text>{item.name}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.dropdownItem}>
                                <Text>No se encontraron ingredientes.</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}

            <View style={styles.filterRow}>
                <TouchableOpacity style={styles.orderButton} onPress={() => setOrderModalVisible(true)}>
                    <Text style={styles.orderButtonText}>Ordenar ▾</Text>
                </TouchableOpacity>
                <SearchTabs selected={searchType} onSelect={handleSearchTabChange} />
            </View>

            {searchType === 'ingredientes' && showIngredientUI ? (
                <View>
                    <Text style={styles.sectionTitle}>🟢 Ingredientes a incluir</Text>
                    <View style={styles.chipsContainer}>
                        {includeIngredients.map((ing) => (
                            <TouchableOpacity
                                key={ing}
                                onPress={() => setIncludeIngredients((prev) => prev.filter((i) => i !== ing))}
                                style={styles.chip}
                            >
                                <Text>{ing} ✕</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>🔴 Ingredientes a excluir</Text>
                    <View style={styles.chipsContainer}>
                        {excludeIngredients.map((ing) => (
                            <TouchableOpacity
                                key={ing}
                                onPress={() => setExcludeIngredients((prev) => prev.filter((i) => i !== ing))}
                                style={styles.chip}
                            >
                                <Text>{ing} ✕</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={styles.clearButton}
                            onPress={() => {
                                setIncludeIngredients([]);
                                setExcludeIngredients([]);
                            }}
                        >
                            <Text>Limpiar Filtros</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                            <Text style={{ color: '#fff' }}>Aplicar filtros</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {searchType === 'ingredientes' && !showIngredientUI && (
                        <TouchableOpacity
                            onPress={() => setShowIngredientUI(true)}
                            style={styles.backToFiltersButton}
                        >
                            <Text style={styles.backToFiltersText}>Volver a filtros de ingredientes</Text>
                        </TouchableOpacity>
                    )}
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {results.length > 0 ? (
                            results.map((receta) => (
                                <RecipeCard
                                    key={receta._id}
                                    id={receta._id}
                                    title={receta.title}
                                    category={receta.category}
                                    author={receta.user}
                                    imageUrl={receta.image_url}
                                    rating={receta.averageRating || 0}
                                    isFavorite={false}
                                    onToggleFavorite={() => { }}
                                    variant="compact"
                                />
                            ))
                        ) : (
                            <Text style={{ textAlign: 'center', color: '#999', marginTop: 32 }}>
                                No se encontraron resultados.
                            </Text>
                        )}
                    </ScrollView>
                </View>
            )}

            <OrderModal
                visible={orderModalVisible}
                selected={selectedOrder}
                onSelect={(value) => setSelectedOrder(value)}
                onClose={() => setOrderModalVisible(false)}
                options={ORDER_OPTIONS}
            />

            <IngredientModal
                visible={ingredientModalVisible}
                ingredient={selectedIngredient}
                onClose={() => setIngredientModalVisible(false)}
                onInclude={(ing) => setIncludeIngredients(prev => [...new Set([...prev, ing])])}
                onExclude={(ing) => setExcludeIngredients(prev => [...new Set([...prev, ing])])}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 60,
        paddingHorizontal: 24,
        flex: 1,
        backgroundColor: '#F6F6F6',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    orderButton: {
        backgroundColor: '#E5E5E5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    orderButtonText: {
        color: '#333',
    },
    dropdown: {
        position: 'absolute',
        top: 17,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderTopWidth: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        maxHeight: 180,
        zIndex: 9999,
        elevation: 10
    },
    dropdownItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    sectionTitle: {
        fontWeight: '600',
        marginTop: 16,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginVertical: 8,
    },
    chip: {
        backgroundColor: '#F3F3F3',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 6,
        marginBottom: 6,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    clearButton: {
        backgroundColor: '#eee',
        padding: 12,
        borderRadius: 8,
    },
    applyButton: {
        backgroundColor: '#025E45',
        padding: 12,
        borderRadius: 8,
    },
    backToFiltersButton: {
        backgroundColor: '#eee',
        padding: 10,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    backToFiltersText: {
        color: '#025E45',
        fontWeight: '600'
    }
});
