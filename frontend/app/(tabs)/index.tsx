import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Platform, Modal, Dimensions } from 'react-native';
import { Image, ImageBackground } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, F } from '@/constants/theme';

// Nota técnica: localhost para Web (CORS passthrough), loca.lt para Móvil.
const API_URL = Platform.OS === 'web'
    ? 'http://127.0.0.1:8000'
    : 'https://small-jeans-raise.loca.lt';

interface Business {
    id: number;
    owner_id: number;
    username: string;
    name: string;
    description: string;
    location: string;
    category: string;
    image_url: string;
    distance: string;
    queue_size: number;
}

const { width } = Dimensions.get('window');

const SafeImageBackground = ({ uri, style, imageStyle, children }: any) => {
    const [error, setError] = useState(false);

    if (!uri || error) {
        return (
            <View style={[style, { backgroundColor: Colors.core.card, overflow: 'hidden', borderRadius: imageStyle?.borderRadius || 0 }]}>
                <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="image-outline" size={40} color={Colors.core.textSecondary} />
                </View>
                {children}
            </View>
        );
    }

    return (
        <ImageBackground source={{ uri }} style={style} imageStyle={imageStyle} onError={() => setError(true)} contentFit="cover" transition={200}>
            {children}
        </ImageBackground>
    );
};

const SafeImage = ({ uri, style }: any) => {
    const [error, setError] = useState(false);

    if (!uri || error) {
        return (
            <View style={[style, { backgroundColor: Colors.core.card, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.core.border }]}>
                <Ionicons name="image-outline" size={30} color={Colors.core.textSecondary} />
            </View>
        );
    }

    return <Image source={{ uri }} style={style} onError={() => setError(true)} contentFit="cover" transition={200} />;
};

export default function HomeScreen() {
    const router = useRouter();
    const [selCategory, setSelCategory] = useState<string>('');
    const [search, setSearch] = useState('');

    const [categories, setCategories] = useState<string[]>([]);
    const [locations, setLocations] = useState<string[]>(['Santo Domingo']);
    const [selectedLocation, setSelectedLocation] = useState('Santo Domingo');
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [businessCache, setBusinessCache] = useState<Record<string, Business[]>>({});

    const [loading, setLoading] = useState(false);
    const [locModalVisible, setLocModalVisible] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const locRes = await fetch(`${API_URL}/locations`, {
                    headers: { 'Bypass-Tunnel-Reminder': 'true' }
                });
                const locData = await locRes.json();
                if (locData && locData.length > 0) {
                    setLocations(locData);
                    if (!locData.includes(selectedLocation)) setSelectedLocation(locData[0]);
                }

                const catRes = await fetch(`${API_URL}/categories`, {
                    headers: { 'Bypass-Tunnel-Reminder': 'true' }
                });
                const catData = await catRes.json();
                if (catData && catData.length > 0) {
                    setCategories(catData);
                    setSelCategory(catData[0]);
                }
            } catch (err) {
                console.log('Error fetching initial configs:', err);
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selCategory) return;

        const fetchBusinesses = async () => {
            const queryKey = `${selCategory}|${selectedLocation}|${search.trim()}`;

            // Si ya tenemos en caché, usamos ese dato instantáneamente y evitamos el loader principal.
            if (businessCache[queryKey]) {
                setBusinesses(businessCache[queryKey]);
            } else {
                setLoading(true);
            }

            try {
                let url = `${API_URL}/businesses?category=${encodeURIComponent(selCategory)}&location=${encodeURIComponent(selectedLocation)}`;
                if (search.trim() !== '') {
                    url += `&search=${encodeURIComponent(search)}`;
                }
                const res = await fetch(url, {
                    headers: { 'Bypass-Tunnel-Reminder': 'true' }
                });
                const data = await res.json();

                // Actualizamos el listado actual y el caché (en background si ya había datos)
                setBusinesses(data);
                setBusinessCache(prev => ({ ...prev, [queryKey]: data }));
            } catch (error) {
                console.log('Error fetching businesses:', error);
            } finally {
                setLoading(false);
            }
        };

        const timerId = setTimeout(() => {
            fetchBusinesses();
        }, 300);

        return () => clearTimeout(timerId);
    }, [selCategory, selectedLocation, search]);

    const nearbyDeals = businesses.slice(0, 3);
    const recommendedDeals = businesses.slice(3);

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

                <View style={s.header}>
                    <View>
                        <Text style={s.locLabel}>Ubicación actual</Text>
                        <TouchableOpacity style={s.locSelector} activeOpacity={0.7} onPress={() => setLocModalVisible(true)}>
                            <Text style={s.locTxt}>{selectedLocation}</Text>
                            <Ionicons name="chevron-down" size={16} color={Colors.core.text} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={s.searchRow}>
                    <View style={s.searchWrap}>
                        <Ionicons name="search" size={20} color={Colors.core.textSecondary} style={s.searchIcon} />
                        <TextInput
                            style={[s.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                            placeholder="Buscar negocio..."
                            placeholderTextColor={Colors.core.textSecondary}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                </View>

                {categories.length > 0 && (
                    <View style={s.catSection}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
                            {categories.map(cat => {
                                const active = selCategory === cat;
                                return (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[s.catChip, active && s.catChipActive]}
                                        onPress={() => setSelCategory(cat)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[s.catTxt, active && s.catTxtActive]}>{cat}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}

                {loading ? (
                    <ActivityIndicator size="large" color={Colors.core.tint} style={{ marginTop: 40 }} />
                ) : businesses.length === 0 ? (
                    <View style={{ padding: 24, alignItems: 'center' }}>
                        <Text style={{ color: Colors.core.textSecondary, fontFamily: F.medium }}>No se encontraron resultados en esta área.</Text>
                    </View>
                ) : (
                    <>
                        {nearbyDeals.length > 0 && (
                            <View style={s.section}>
                                <View style={s.sectionHeader}>
                                    <Text style={s.sectionTitle}>Cerca de ti</Text>
                                    {nearbyDeals.length > 2 && <TouchableOpacity><Text style={s.seeAll}>Ver más</Text></TouchableOpacity>}
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll} snapToInterval={280} decelerationRate="fast">
                                    {nearbyDeals.map(deal => (
                                        <TouchableOpacity key={deal.id} activeOpacity={0.85} style={s.dealCard} onPress={() => router.push({ pathname: `/business/${deal.id}` as any, params: { initialData: JSON.stringify(deal) } })}>
                                            <SafeImageBackground uri={deal.image_url} style={s.dealImg} imageStyle={{ borderRadius: 16 }}>
                                                <View style={s.dealTop}>
                                                    <View style={s.badgeGrid}>
                                                        <View style={s.statusBadge}>
                                                            <Ionicons name="people" size={14} color={deal.queue_size === 0 ? '#4CAF50' : Colors.core.text} />
                                                            <Text style={[s.badgeTxt, { color: deal.queue_size === 0 ? '#4CAF50' : Colors.core.text }]}>
                                                                {deal.queue_size === 0 ? 'Sin fila' : `${deal.queue_size} en cola`}
                                                            </Text>
                                                        </View>
                                                        <View style={s.statusBadge}>
                                                            <Ionicons name="location" size={14} color={Colors.core.text} />
                                                            <Text style={s.badgeTxt}>{deal.distance}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </SafeImageBackground>
                                            <View style={s.dealInfo}>
                                                <Text style={s.dealTitle} numberOfLines={1}>{deal.name}</Text>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {recommendedDeals.length > 0 && (
                            <View style={[s.section, { marginBottom: 30 }]}>
                                <View style={s.sectionHeader}>
                                    <Text style={s.sectionTitle}>Recomendados para ti</Text>
                                    {recommendedDeals.length >= 5 && <TouchableOpacity><Text style={s.seeAll}>Ver más</Text></TouchableOpacity>}
                                </View>
                                <View style={s.vList}>
                                    {recommendedDeals.map(rec => (
                                        <TouchableOpacity key={rec.id} activeOpacity={0.7} style={s.recCard} onPress={() => router.push({ pathname: `/business/${rec.id}` as any, params: { initialData: JSON.stringify(rec) } })}>
                                            <SafeImage uri={rec.image_url} style={s.recImg} />
                                            <View style={s.recDetail}>
                                                <Text style={s.recTitle} numberOfLines={1}>{rec.name}</Text>
                                                <View style={s.recRow}>
                                                    <View style={[s.statusBadge, { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'transparent', borderColor: 'transparent', paddingLeft: 0 }]}>
                                                        <Ionicons name="people" size={12} color={rec.queue_size === 0 ? '#4CAF50' : Colors.core.textSecondary} />
                                                        <Text style={[s.badgeTxt, { fontSize: 13, color: rec.queue_size === 0 ? '#4CAF50' : Colors.core.textSecondary }]}>
                                                            {rec.queue_size === 0 ? 'Sin fila' : `${rec.queue_size} en cola`}
                                                        </Text>
                                                    </View>
                                                    <Text style={s.recLocationTxt}>·</Text>
                                                    <Text style={s.recLocationTxt}>{rec.distance}</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </>
                )}

            </ScrollView>

            <Modal visible={locModalVisible} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={s.modalFullScreen}>
                    <View style={s.modalHeaderFS}>
                        <TouchableOpacity onPress={() => setLocModalVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={s.modalCloseBtn}>
                            <Ionicons name="close" size={24} color={Colors.core.text} />
                        </TouchableOpacity>
                        <Text style={s.modalTitleFS}>Seleccionar Ubicación</Text>
                        <View style={{ width: 24 }} /> {/* Spacer to center title */}
                    </View>

                    <ScrollView contentContainerStyle={s.modalListFS}>
                        <Text style={s.modalGroupTitle}>Ciudades Disponibles</Text>
                        <View style={s.modalOptionsCard}>
                            {locations.map((loc, index) => (
                                <TouchableOpacity
                                    key={loc}
                                    style={[s.modalItemFS, index !== locations.length - 1 && s.modalItemBorder]}
                                    onPress={() => {
                                        setSelectedLocation(loc);
                                        setLocModalVisible(false);
                                    }}
                                >
                                    <Text style={[s.modalItemTxtFS, selectedLocation === loc && s.modalItemTxtActiveFS]}>{loc}</Text>
                                    {selectedLocation === loc && <Ionicons name="checkmark" size={24} color={Colors.core.text} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.core.background },
    scroll: { paddingBottom: 40 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, marginBottom: 24 },
    locLabel: { fontSize: 13, fontFamily: F.regular, color: Colors.core.textSecondary, marginBottom: 4 },
    locSelector: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    locTxt: { fontSize: 18, fontFamily: F.semibold, color: Colors.core.text },

    searchRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginBottom: 24 },
    searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.core.card, borderRadius: 12, height: 54, paddingHorizontal: 16 },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, fontSize: 15, fontFamily: F.regular, color: Colors.core.text },

    catSection: { marginBottom: 32 },
    catScroll: { paddingHorizontal: 24, gap: 10 },
    catChip: { paddingHorizontal: 18, height: 40, borderRadius: 20, backgroundColor: Colors.core.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.core.border },
    catChipActive: { backgroundColor: Colors.core.text, borderColor: Colors.core.text },
    catTxt: { fontSize: 14, fontFamily: F.medium, color: Colors.core.textSecondary },
    catTxtActive: { color: Colors.core.background, fontFamily: F.semibold },

    section: { marginBottom: 32 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 },
    sectionTitle: { fontSize: 20, fontFamily: F.bold, color: Colors.core.text },
    seeAll: { fontSize: 14, fontFamily: F.medium, color: Colors.core.textSecondary },

    hScroll: { paddingHorizontal: 24, gap: 16 },
    dealCard: { width: 264 },
    dealImg: { width: '100%', height: 180, justifyContent: 'space-between' },
    dealTop: { padding: 12 },
    badgeGrid: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0, 0, 0, 0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    badgeTxt: { color: Colors.core.text, fontSize: 12, fontFamily: F.medium },
    dealInfo: { paddingTop: 12, paddingHorizontal: 4 },
    dealTitle: { fontSize: 16, fontFamily: F.semibold, color: Colors.core.text, marginBottom: 2 },

    vList: { paddingHorizontal: 24, gap: 16 },
    recCard: { flexDirection: 'row', backgroundColor: Colors.core.card, borderRadius: 16, padding: 12, gap: 14 },
    recImg: { width: 80, height: 80, borderRadius: 10 },
    recDetail: { flex: 1, justifyContent: 'center' },
    recTitle: { fontSize: 16, fontFamily: F.semibold, color: Colors.core.text, marginBottom: 4 },
    recRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    recLocationTxt: { fontSize: 13, fontFamily: F.medium, color: Colors.core.textSecondary },

    modalFullScreen: { flex: 1, backgroundColor: Colors.core.background },
    modalHeaderFS: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.core.border },
    modalCloseBtn: { padding: 4 },
    modalTitleFS: { fontSize: 18, fontFamily: F.semibold, color: Colors.core.text },
    modalListFS: { padding: 20 },
    modalGroupTitle: { fontSize: 14, fontFamily: F.medium, color: Colors.core.textSecondary, marginBottom: 12, marginLeft: 8 },
    modalOptionsCard: { backgroundColor: Colors.core.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.core.border },
    modalItemFS: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20 },
    modalItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.core.border },
    modalItemTxtFS: { fontSize: 17, fontFamily: F.regular, color: Colors.core.text },
    modalItemTxtActiveFS: { fontFamily: F.semibold, color: Colors.core.text },
});
