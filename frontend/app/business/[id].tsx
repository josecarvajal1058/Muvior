import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert, Linking, Animated, Easing } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, F } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Nota técnica: localhost para Web (CORS passthrough), loca.lt para Móvil.
const API_URL = Platform.OS === 'web'
    ? 'http://127.0.0.1:8000'
    : 'https://small-jeans-raise.loca.lt';

interface Service {
    id: number;
    business_id: number;
    name: string;
    average_duration_minutes: number;
    is_autonomous: boolean;
    capacity: number;
}

interface BusinessDetail {
    id: number;
    name: string;
    description: string;
    location: string;
    category: string;
    image_url: string;
    distance: string;
    queue_size: number;
    queue_type: string;
    average_duration_minutes?: number;
    open_time: string;
    close_time: string;
    days_open: string;
    phone?: string;
}

export default function BusinessDetailScreen() {
    const { id, initialData } = useLocalSearchParams();
    const router = useRouter();

    const [business, setBusiness] = useState<BusinessDetail | null>(() => {
        if (initialData && typeof initialData === 'string') {
            try {
                return JSON.parse(initialData);
            } catch (e) {
                return null;
            }
        }
        return null;
    });
    const [loading, setLoading] = useState(!initialData);
    const [showHours, setShowHours] = useState(false);

    const [hasTurn, setHasTurn] = useState<boolean | null>(null);
    const [position, setPosition] = useState<number>(0);
    const [turnStatus, setTurnStatus] = useState<string | null>(null);
    const [currentServiceName, setCurrentServiceName] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [userInfo, setUserInfo] = useState<{ name: string, email: string } | null>(null);
    const [localTurnState, setLocalTurnState] = useState<'arrived' | 'verifying' | 'serving'>('arrived');

    const [services, setServices] = useState<Service[]>([]);
    const [selectedServices, setSelectedServices] = useState<number[]>([]);



    useEffect(() => {
        const loadUser = async () => {
            try {
                const uidStr = await AsyncStorage.getItem('user_id');
                if (uidStr) {
                    setUserId(parseInt(uidStr, 10));
                } else {
                    console.log('Dev Mode: Setting default userId 1');
                    setUserId(1);
                }
            } catch (err) {
                setUserId(1);
            }
        };
        loadUser();
    }, []);

    const fetchDetails = async () => {
        try {
            const res = await fetch(`${API_URL}/businesses/${id}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            if (res.ok) {
                const data = await res.json();
                setBusiness(data);
            }
        } catch (error) {
            console.log('Error fetching business detail', error);
            setLoading(false);
        }
    };

    const fetchQueueStatus = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_URL}/businesses/${id}/turn/${userId}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            if (res.ok) {
                const data = await res.json();
                setHasTurn(data.has_turn);
                setPosition(data.position);
                setTurnStatus(data.status);
                setCurrentServiceName(data.current_service_name);
            }
        } catch (error) {
            console.log('Error fetching queue status', error);
        }
    };

    const fetchUserInfo = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_URL}/users/${userId}`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            if (res.ok) {
                const data = await res.json();
                setUserInfo({ name: data.name, email: data.email });
            }
        } catch (error) {
            console.log('Error fetching user info', error);
        }
    };

    const fetchServices = async () => {
        try {
            const res = await fetch(`${API_URL}/businesses/${id}/services`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            if (res.ok) {
                const data = await res.json();
                setServices(data);
            }
        } catch (error) {
            console.log('Error fetching services', error);
        }
    };

    useEffect(() => {
        if (id) {
            fetchDetails();
            fetchServices();
            if (userId) {
                fetchQueueStatus();
                fetchUserInfo();
            }
        }
    }, [id, userId]);

    useEffect(() => {
        if (business) setLoading(false);
    }, [business]);

    const isOpenNow = React.useMemo(() => {
        if (!business) return true;

        try {
            const now = new Date();
            const day = now.getDay();
            const daysOpen = business.days_open.split(',').map(Number);

            if (!daysOpen.includes(day)) return false;

            const currentMins = now.getHours() * 60 + now.getMinutes();
            const openParts = business.open_time.split(':').map(Number);
            const closeParts = business.close_time.split(':').map(Number);

            const openMins = openParts[0] * 60 + openParts[1];
            const closeMins = closeParts[0] * 60 + closeParts[1];

            return currentMins >= openMins && currentMins <= closeMins;
        } catch (e) {
            return true;
        }
    }, [business]);

    const formatTimeAMPM = (time24: string) => {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        let h = parseInt(hours, 10);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        return `${h}:${minutes} ${ampm}`;
    };

    const renderSchedule = () => {
        if (!business) return null;
        const daysOpenMap = new Set(business.days_open.split(',').map(Number));
        // Order: Lunes (1) to Domingo (0)
        const orderedDays = [1, 2, 3, 4, 5, 6, 0];
        const dayNamesMap: Record<number, string> = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };

        const groups: { startDay: number, endDay: number, isOpen: boolean }[] = [];
        let currentGroup: { startDay: number, endDay: number, isOpen: boolean } | null = null;

        for (const day of orderedDays) {
            const isOpen = daysOpenMap.has(day);
            if (!currentGroup) {
                currentGroup = { startDay: day, endDay: day, isOpen };
            } else if (currentGroup.isOpen === isOpen) {
                currentGroup.endDay = day;
            } else {
                groups.push(currentGroup);
                currentGroup = { startDay: day, endDay: day, isOpen };
            }
        }
        if (currentGroup) groups.push(currentGroup);

        const formatGroupLabel = (start: number, end: number) => {
            if (start === end) return dayNamesMap[start];
            if (start === 1 && end === 5) return 'Lunes a Viernes';
            if (start === 6 && end === 0) return 'Fines de semana';
            if (start === 1 && end === 6) return 'Lunes a Sábado';
            return `${dayNamesMap[start]} a ${dayNamesMap[end]}`;
        };

        const hoursString = `${formatTimeAMPM(business.open_time)} - ${formatTimeAMPM(business.close_time)}`;

        return groups.map((g, idx) => (
            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: idx < groups.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.03)' }}>
                <Text style={{ color: Colors.core.text, fontFamily: F.regular, fontSize: 14 }}>
                    {formatGroupLabel(g.startDay, g.endDay)}
                </Text>
                {g.isOpen ? (
                    <Text style={{ color: Colors.core.textSecondary, fontFamily: F.regular, fontSize: 14 }}>
                        {hoursString}
                    </Text>
                ) : (
                    <Text style={{ color: Colors.core.tint, fontFamily: F.medium, fontSize: 14 }}>
                        Cerrado
                    </Text>
                )}
            </View>
        ));
    };

    useEffect(() => {
        if (id && userId) {
            const interval = setInterval(() => {
                fetchDetails();
                fetchQueueStatus();
            }, 3000);

            return () => clearInterval(interval);
        }
    }, [id, userId]);

    const getEstimatedTime = (queueSize: number) => {
        if (queueSize === 0) return '0';
        const totalMins = queueSize * (business?.average_duration_minutes || 15);

        if (totalMins < 60) return `${totalMins}m`;

        const hours = Math.floor(totalMins / 60);
        const mins = totalMins % 60;

        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    };

    const getInitials = (name: string) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const toggleService = (serviceId: number) => {
        setSelectedServices(prev =>
            prev.includes(serviceId) ? prev.filter(sid => sid !== serviceId) : [...prev, serviceId]
        );
    };

    const handleTakeTurn = async () => {
        if (!userId) {
            Alert.alert("Autenticación", "Debes iniciar sesión para tomar un turno.");
            return;
        }

        if (business?.queue_type === 'ESTACIONES' && selectedServices.length === 0) {
            Alert.alert("Selección requerida", "Debes seleccionar al menos un servicio para continuar.");
            return;
        }

        setActionLoading(true);
        try {
            const serviceIdsToSend = business?.queue_type === 'ESTACIONES' ? selectedServices : (services.length > 0 ? [services[0].id] : []);

            if (serviceIdsToSend.length === 0) {
                Alert.alert("Error", "Este negocio no tiene servicios configurados. Intenta más tarde.");
                setActionLoading(false);
                return;
            }

            const res = await fetch(`${API_URL}/businesses/${id}/turn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                body: JSON.stringify({ user_id: userId, service_ids: serviceIdsToSend })
            });

            const data = await res.json();

            if (res.ok) {
                await fetchDetails();
                await fetchQueueStatus();
            } else {
                Alert.alert("Aviso", data.detail || "Error al tomar turno");
            }
        } catch (err) {
            Alert.alert("Error de conexión");
        } finally {
            setActionLoading(false);
        }
    };

    const executeLeaveTurn = async () => {
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/businesses/${id}/turn/${userId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' }
            });

            if (res.ok) {
                await fetchDetails();
                await fetchQueueStatus();
            } else {
                const data = await res.json();
                Alert.alert("Aviso", data.detail || "Error al salir de la cola");
            }
        } catch (err) {
            Alert.alert("Error de conexión");
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeaveTurn = async (e?: any) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!userId) return;

        if (Platform.OS === 'web') {
            const confirmed = window.confirm("¿Estás seguro que deseas salir de la cola?");
            if (confirmed) {
                await executeLeaveTurn();
            }
        } else {
            Alert.alert(
                "Salir de la cola",
                "¿Estás seguro que deseas salir de la cola?",
                [
                    { text: "No", style: "cancel" },
                    { text: "Sí, salir", style: "destructive", onPress: executeLeaveTurn }
                ]
            );
        }
    };

    const handleOpenMap = () => {
        if (business?.name && business?.location) {
            const query = encodeURIComponent(`${business.name} ${business.location}`);
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
        }
    };

    const handleCallBusiness = () => {
        if (business?.phone) {
            Linking.openURL(`tel:${business.phone}`);
        } else {
            Alert.alert("Aviso", "Este negocio no ha registrado un número de teléfono.");
        }
    };

    if (loading) {
        return (
            <View style={s.layout}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={Colors.core.text} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push({ pathname: '/business/admin_dashboard', params: { id } })} style={s.backBtn}>
                        <Ionicons name="settings" size={20} color={Colors.core.text} />
                    </TouchableOpacity>
                </View>
                <ActivityIndicator size="large" color={Colors.core.tint} style={{ marginTop: 60 }} />
            </View>
        );
    }

    if (!business) {
        return (
            <View style={s.layout}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={Colors.core.text} />
                    </TouchableOpacity>
                    <View style={{ width: 40 }} />
                </View>
                <Text style={{ color: Colors.core.text, textAlign: 'center', marginTop: 50, fontFamily: F.medium }}>Negocio no encontrado</Text>
            </View>
        );
    }

    return (
        <View style={s.root}>
            <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false} bounces={false}>

                <View style={s.heroContainer}>
                    <Image
                        source={{ uri: business.image_url || 'https://images.unsplash.com/photo-1542314831-c53cd3816002?w=800&q=80' }}
                        style={s.heroImg}
                        contentFit="cover"
                        transition={300}
                    />

                    <LinearGradient colors={['rgba(0,0,0,0.8)', 'transparent']} style={s.heroOverlayTop} />

                    <LinearGradient colors={['transparent', Colors.core.background]} style={s.heroOverlayBottom} />

                    <View style={s.heroFooter}>
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                            {!isOpenNow ? (
                                <View style={[s.statusPill, { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24 }]}>
                                    <View style={s.statusDotClosed} />
                                    <Text style={[s.statusPillTxt, { color: '#FFFFFF', fontSize: 13, fontFamily: F.bold }]}>Cerrado</Text>
                                </View>
                            ) : (
                                <View style={[s.statusPill, { backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24 }]}>
                                    <View style={s.statusDotOpen} />
                                    <Text style={[s.statusPillTxt, { color: '#FFFFFF', fontSize: 13, fontFamily: F.bold }]}>Abierto</Text>
                                </View>
                            )}
                        </View>
                        <Text style={s.heroTitle}>{business.name}</Text>
                        <View style={s.heroMeta}>
                            <Ionicons name="location" size={16} color={Colors.core.textSecondary} />
                            <Text style={s.heroMetaTxt}>{business.location} • {business.distance}</Text>
                        </View>
                    </View>
                </View>

                <View style={s.body}>
                    <View style={s.queueMatrixCard}>
                        <View style={s.queueHeader}>
                            <Text style={s.queueMatrixTitle}>Estado Virtual</Text>
                        </View>

                        <View style={s.queueStatsGrid}>
                            <View style={[s.queueStatBox, { flex: 1 }]}>
                                <Text style={s.queueStatValue} adjustsFontSizeToFit numberOfLines={1}>{business.queue_size}</Text>
                                <Text style={s.queueStatLabel}>EN COLA</Text>
                            </View>
                            <View style={s.queueStatDivider} />
                            <View style={[s.queueStatBox, { flex: 1 }]}>
                                <Text style={s.queueStatValue} adjustsFontSizeToFit numberOfLines={1}>{getEstimatedTime(business.queue_size)}</Text>
                                <Text style={s.queueStatLabel}>TIEMPO EST.</Text>
                            </View>
                        </View>

                        {hasTurn === null ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <ActivityIndicator size="small" color={Colors.core.tint} />
                            </View>
                        ) : hasTurn ? (
                            <View>
                                {position > 1 && turnStatus === 'waiting' ? (
                                    <View style={s.ticketContainer}>
                                        <View style={s.ticketMain}>
                                            <Text style={[s.ticketLabel, { letterSpacing: 1.5, fontSize: 12 }]}>POSICIÓN</Text>
                                            <Text style={s.myTurnNum}>{position}</Text>
                                        </View>
                                        {!isOpenNow && (
                                            <View style={s.ticketSecureBanner}>
                                                <Text style={s.ticketSecureTxt}>Lugar asegurado</Text>
                                            </View>
                                        )}
                                    </View>
                                ) : (
                                    (() => {
                                        let cardBg = Colors.core.card;
                                        let cardBorder = Colors.core.border;
                                        let title = currentServiceName ? `¡Pase a ${currentServiceName}!` : 'Es tu turno';
                                        let subtitle = turnStatus === 'in_progress' ? 'Dirígete a la estación asignada para ser asistido.' : 'Por favor, dirígete al área de atención\nprincipal para ser asistido.';
                                        let step1Label = 'Confirmar';
                                        let step1Color = '#FFFFFF';
                                        let step1Dot = Colors.core.tint;
                                        let step2Label = 'Atendiendo';
                                        let step2Color = '#888888';
                                        let step2Dot = '#555555';
                                        let step3Label = 'Finalizado';
                                        let step3Color = '#888888';
                                        let step3Dot = '#555555';
                                        let progressWidth = '0%';
                                        let activeStep = 1;

                                        if (localTurnState === 'verifying') {
                                            cardBg = Colors.core.card;
                                            cardBorder = Colors.core.border;
                                            title = '';
                                            subtitle = 'Muéstrale este código quien atiende';
                                            step1Label = 'Verificando';
                                            step1Color = '#FFFFFF';
                                            step1Dot = Colors.core.tint;
                                            activeStep = 1;
                                            progressWidth = '25%';
                                        } else if (localTurnState === 'serving') {
                                            cardBg = Colors.core.card;
                                            cardBorder = Colors.core.border;
                                            title = 'En Atención';
                                            const firstName = userInfo?.name?.split(' ')[0] || 'Cliente';
                                            subtitle = `Disfruta de tu servicio, ${firstName}.\nAvisaremos cuando finalice.`;
                                            step1Label = 'Confirmar';
                                            step1Color = '#FFFFFF';
                                            step1Dot = Colors.core.tint;
                                            step2Label = 'Atendiendo';
                                            step2Color = '#FFFFFF';
                                            step2Dot = Colors.core.tint;
                                            progressWidth = '50%';
                                            activeStep = 2;
                                        }

                                        return (
                                            <View style={s.turnActiveRoot}>
                                                <View style={[s.turnActiveCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                                                    {title ? <Text style={s.turnActiveTitle}>{title}</Text> : null}
                                                    {localTurnState !== 'verifying' && subtitle ? <Text style={s.turnActiveSubtitle}>{subtitle}</Text> : null}

                                                    {localTurnState === 'verifying' && (
                                                        <>
                                                            <View style={s.accessCodeRow}>
                                                                <View style={s.accessDigitCard}><Text style={s.accessDigitTxt}>8</Text></View>
                                                                <View style={s.accessDigitCard}><Text style={s.accessDigitTxt}>0</Text></View>
                                                                <View style={s.accessDigitCard}><Text style={s.accessDigitTxt}>6</Text></View>
                                                            </View>
                                                            <Text style={s.turnActiveSubtitle}>{subtitle}</Text>
                                                        </>
                                                    )}

                                                    <View style={s.stepperRoot}>
                                                        <View style={s.stepperTrack}>
                                                            <View style={[s.stepperFill, { width: progressWidth as any }]} />
                                                        </View>
                                                        <View style={s.stepperSteps}>
                                                            <View style={s.stepCol}>
                                                                <View style={[s.stepDot, { backgroundColor: step1Dot }, activeStep === 1 && s.stepDotActiveGlow]} />
                                                                <Text style={[s.stepLabel, { color: step1Color }]}>{step1Label}</Text>
                                                            </View>
                                                            <View style={s.stepCol}>
                                                                <View style={[s.stepDot, { backgroundColor: step2Dot }, activeStep === 2 && s.stepDotActiveGlow]} />
                                                                <Text style={[s.stepLabel, { color: step2Color }]}>{step2Label}</Text>
                                                            </View>
                                                            <View style={s.stepCol}>
                                                                <View style={[s.stepDot, { backgroundColor: step3Dot }, activeStep === 3 && s.stepDotActiveGlow]} />
                                                                <Text style={[s.stepLabel, { color: step3Color }]}>{step3Label}</Text>
                                                            </View>
                                                        </View>
                                                    </View>
                                                </View>

                                                {localTurnState === 'arrived' && (
                                                    <TouchableOpacity style={s.takeTurnBtn} activeOpacity={0.8} onPress={() => setLocalTurnState('verifying')}>
                                                        <Text style={s.takeTurnTxt}>Confirmar llegada</Text>
                                                    </TouchableOpacity>
                                                )}
                                                {localTurnState === 'serving' && (
                                                    <TouchableOpacity style={[s.takeTurnBtn, { backgroundColor: Colors.core.card, borderColor: Colors.core.border, borderWidth: 1 }]} activeOpacity={0.8} onPress={(e) => { setLocalTurnState('arrived'); handleLeaveTurn(e); }}>
                                                        <Text style={[s.takeTurnTxt, { color: Colors.core.text }]}>Finalizar Servicio</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        );
                                    })()
                                )}

                                {turnStatus === 'waiting' && (
                                    <TouchableOpacity
                                        style={s.leaveBtnDestructive}
                                        onPress={(e) => handleLeaveTurn(e)}
                                        activeOpacity={0.7}
                                        disabled={actionLoading}
                                    >
                                        <Text style={s.leaveBtnDestructiveTxt}>Salir de la cola</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ) : userId && userInfo ? (
                            <View>
                                {services.length > 0 && business?.queue_type === 'ESTACIONES' && !hasTurn && (
                                    <View style={{ marginBottom: 24 }}>
                                        <Text style={[s.sectionTitle, { marginBottom: 4 }]}>Selecciona tus servicios</Text>
                                        <Text style={{ color: Colors.core.textSecondary, fontFamily: F.regular, marginBottom: 16 }}>Arma tu paquete para entrar a la fila correcta.</Text>
                                        {services.map(srv => {
                                            const isSelected = selectedServices.includes(srv.id);
                                            return (
                                                <TouchableOpacity
                                                    key={srv.id}
                                                    style={[s.serviceCard, isSelected && s.serviceCardSelected]}
                                                    activeOpacity={0.7}
                                                    onPress={() => toggleService(srv.id)}
                                                >
                                                    <View style={[s.checkbox, isSelected && s.checkboxSelected]}>
                                                        {isSelected && <Ionicons name="checkmark" size={14} color="#000" />}
                                                    </View>
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={[s.serviceName, isSelected && s.serviceNameSelected]}>{srv.name}</Text>
                                                        <Text style={s.serviceDuration}>~{srv.average_duration_minutes} min</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}

                                <View style={s.takeTurnCard}>
                                    <View style={s.takeTurnIconCircle}>
                                        <Ionicons name="footsteps-outline" size={24} color={Colors.core.text} />
                                    </View>
                                    <Text style={s.takeTurnCardTitle}>Toma tu turno</Text>
                                    <Text style={s.takeTurnCardSubtitle}>
                                        Únete a la fila virtual y te avisaremos cuando sea tu momento.
                                    </Text>

                                    <View style={s.userProfileRow}>
                                        <View style={s.userAvatar}>
                                            <Text style={s.userAvatarTxt}>{getInitials(userInfo.name)}</Text>
                                        </View>
                                        <View style={s.userInfoTextCol}>
                                            <Text style={s.userNameTxt} numberOfLines={1}>{userInfo.name}</Text>
                                            <Text style={s.userEmailTxt} numberOfLines={1}>{userInfo.email}</Text>
                                        </View>
                                        <View style={s.userCheckCircle}>
                                            <Ionicons name="checkmark" size={12} color="#4CAF50" />
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        style={s.takeTurnBtnWhite}
                                        activeOpacity={0.8}
                                        onPress={handleTakeTurn}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? (
                                            <ActivityIndicator size="small" color="#000" />
                                        ) : (
                                            <Text style={s.takeTurnTxtDark}>Unirse a la fila</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={s.takeTurnBtn}
                                activeOpacity={0.8}
                                onPress={handleTakeTurn}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={s.takeTurnTxt}>Tomar turno</Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={s.divider} />

                    {business.description ? (
                        <View style={s.section}>
                            <Text style={s.sectionSubtitle}>Sobre el negocio</Text>
                            <Text style={s.descTxt}>{business.description}</Text>
                        </View>
                    ) : null}

                    {business.description && <View style={s.divider} />}

                    <View style={s.section}>
                        <TouchableOpacity
                            onPress={() => setShowHours(!showHours)}
                            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                            activeOpacity={0.7}
                        >
                            <Text style={[s.sectionTitle, { marginBottom: 0 }]}>Horarios</Text>
                            <Ionicons name={showHours ? "chevron-up" : "chevron-down"} size={20} color={Colors.core.textSecondary} />
                        </TouchableOpacity>

                        {showHours && (
                            <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' }}>
                                {renderSchedule()}
                            </View>
                        )}
                    </View>

                    <View style={s.divider} />

                    <View style={s.section}>
                        <Text style={s.sectionTitle}>Contacto y Ubicación</Text>

                        <TouchableOpacity style={[s.mapBtn, { marginBottom: 12 }]} onPress={handleOpenMap} activeOpacity={0.7}>
                            <Ionicons name="map-outline" size={20} color={Colors.core.text} />
                            <Text style={s.mapBtnTxt}>Ver en Google Maps</Text>
                        </TouchableOpacity>

                        {business.phone ? (
                            <TouchableOpacity style={s.mapBtn} onPress={handleCallBusiness} activeOpacity={0.7}>
                                <Ionicons name="call-outline" size={20} color={Colors.core.text} />
                                <Text style={s.mapBtnTxt}>Llamar al Negocio</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>



                </View>

            </ScrollView>

            <View style={s.header}>
                <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={24} color={Colors.core.text} />
                </TouchableOpacity>

                <TouchableOpacity style={s.backBtn} onPress={() => router.push({ pathname: '/business/admin_dashboard', params: { id } })} activeOpacity={0.7}>
                    <Ionicons name="settings" size={20} color={Colors.core.text} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.core.background },
    layout: { flex: 1, backgroundColor: Colors.core.background },
    scrollContent: { paddingBottom: 60 },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 24,
        paddingBottom: 12,
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center', justifyContent: 'center',
    },

    heroContainer: { width: '100%', height: 350, position: 'relative' },
    heroImg: { width: '100%', height: '100%' },
    heroOverlayTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 120 },
    heroOverlayBottom: { position: 'absolute', bottom: -2, left: 0, right: 0, height: 260 },

    heroFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, zIndex: 10 },
    catBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, height: 28, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center' },
    catBadgeTxt: { color: '#E0E0E0', fontFamily: F.semibold, fontSize: 13 },
    heroTitle: { color: Colors.core.text, fontFamily: F.bold, fontSize: 32, marginBottom: 8 },
    heroMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    heroMetaTxt: { color: Colors.core.textSecondary, fontFamily: F.regular, fontSize: 14 },

    body: { padding: 24, paddingTop: 24 },

    queueMatrixCard: { backgroundColor: Colors.core.background, marginBottom: 32 },
    queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    queueMatrixTitle: { fontSize: 18, fontFamily: F.bold, color: Colors.core.text, letterSpacing: -0.5 },

    queueStatsGrid: { flexDirection: 'row', backgroundColor: Colors.core.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.core.border, padding: 20, marginBottom: 24 },
    queueStatBox: { alignItems: 'center' },
    queueStatDivider: { width: 1, backgroundColor: Colors.core.border, height: '80%', alignSelf: 'center', marginHorizontal: 15 },
    queueStatValue: { fontSize: 32, fontFamily: F.bold, color: Colors.core.text, marginBottom: 4, letterSpacing: -1 },
    queueStatLabel: { fontSize: 9, fontFamily: F.bold, color: Colors.core.textSecondary, letterSpacing: 1.5, textTransform: 'uppercase' },

    ticketContainer: { backgroundColor: Colors.core.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.core.border, overflow: 'hidden' },

    ticketMain: { padding: 32, alignItems: 'center' },
    myTurnNum: { fontSize: 72, fontFamily: F.bold, color: Colors.core.text, lineHeight: 72, marginTop: 8 },
    ticketLabel: { fontSize: 13, fontFamily: F.medium, color: Colors.core.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
    ticketSecureBanner: { backgroundColor: '#333333', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.core.border, alignItems: 'center', justifyContent: 'center' },
    ticketSecureTxt: { fontSize: 13, fontFamily: F.semibold, color: Colors.core.text },

    turnActiveRoot: { width: '100%', marginBottom: 16 },
    turnActiveCard: { backgroundColor: '#1C1C1C', borderRadius: 24, borderWidth: 1, borderColor: '#262626', alignItems: 'center', paddingTop: 40, paddingBottom: 24, paddingHorizontal: 16, marginBottom: 16 },

    stepperRoot: { width: '100%', position: 'relative', marginTop: 8, marginBottom: 16 },
    stepperTrack: { position: 'absolute', top: 5, left: '16.6%', right: '16.6%', height: 3, backgroundColor: '#3A3A3A', borderRadius: 1.5, zIndex: 1 },
    stepperFill: { height: 3, backgroundColor: Colors.core.tint, borderRadius: 1.5 },
    stepperSteps: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', zIndex: 2 },
    stepCol: { alignItems: 'center', flex: 1 },
    stepDot: { width: 14, height: 14, borderRadius: 7, marginBottom: 14 },
    stepDotActiveGlow: { shadowColor: Colors.core.tint, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 5 },
    stepLabel: { fontSize: 12, fontFamily: F.semibold },

    accessCodeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    accessDigitCard: { width: 70, height: 80, backgroundColor: Colors.core.background, borderRadius: 16, borderWidth: 1, borderColor: Colors.core.border, alignItems: 'center', justifyContent: 'center' },
    accessDigitTxt: { fontSize: 40, fontFamily: F.bold, color: Colors.core.text, marginTop: 4 },

    turnActiveTitle: { fontSize: 26, fontFamily: F.bold, color: Colors.core.text, textAlign: 'center', marginBottom: 12, letterSpacing: -0.3 },
    turnActiveSubtitle: { fontSize: 15, fontFamily: F.regular, color: '#A0A0A0', textAlign: 'center', lineHeight: 22, marginBottom: 36, paddingHorizontal: 20 },

    takeTurnBtn: { backgroundColor: Colors.core.tint, borderRadius: 12, height: 52, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    takeTurnTxt: { color: "#fff", fontSize: 16, fontFamily: F.medium, letterSpacing: 0.3 },

    divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 24 },

    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontFamily: F.bold, color: Colors.core.text, letterSpacing: -0.3, marginBottom: 12 },
    sectionSubtitle: { fontSize: 14, fontFamily: F.semibold, color: Colors.core.text, letterSpacing: -0.2, marginBottom: 8 },
    descTxt: { fontSize: 15, fontFamily: F.regular, color: Colors.core.textSecondary, lineHeight: 24 },

    mapBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.core.card, borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.core.border },
    mapBtnTxt: { fontSize: 15, fontFamily: F.bold, color: Colors.core.text },

    leaveBtn: { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.core.card, borderRadius: 10, paddingVertical: 14, gap: 10, borderWidth: 1, borderColor: Colors.core.border },
    leaveBtnTxt: { fontSize: 15, fontFamily: F.bold, color: Colors.core.textSecondary },

    leaveBtnDestructive: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 56, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: 10, gap: 10 },
    leaveBtnDestructiveTxt: { fontSize: 16, fontFamily: F.bold, color: '#FF5252' },

    statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.core.card, paddingHorizontal: 12, height: 28, borderRadius: 14, borderWidth: 1, borderColor: Colors.core.border, gap: 6, justifyContent: 'center' },
    statusDotClosed: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.core.tint },
    statusDotOpen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
    statusPillTxt: { fontSize: 13, color: Colors.core.text, fontFamily: F.semibold },

    takeTurnCard: {
        backgroundColor: Colors.core.card,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.core.border,
        marginTop: 16
    },
    takeTurnIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#333333',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16
    },
    takeTurnCardTitle: {
        fontSize: 22,
        fontFamily: F.bold,
        color: Colors.core.text,
        marginBottom: 8,
        letterSpacing: -0.5
    },
    takeTurnCardSubtitle: {
        fontSize: 14,
        fontFamily: F.regular,
        color: Colors.core.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
        paddingHorizontal: 16
    },
    userProfileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        width: '100%',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#333333',
        marginBottom: 24
    },
    userAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.core.tint,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    userAvatarTxt: {
        color: '#fff',
        fontFamily: F.bold,
        fontSize: 16
    },
    userInfoTextCol: {
        flex: 1
    },
    userNameTxt: {
        color: Colors.core.text,
        fontFamily: F.bold,
        fontSize: 15,
        marginBottom: 2
    },
    userEmailTxt: {
        color: Colors.core.textSecondary,
        fontFamily: F.regular,
        fontSize: 13
    },
    userCheckCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(76, 175, 80, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8
    },
    takeTurnBtnWhite: {
        backgroundColor: '#FFFFFF',
        borderRadius: 100,
        height: 56,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    takeTurnTxtDark: {
        color: '#000000',
        fontSize: 16,
        fontFamily: F.medium,
        letterSpacing: 0.2
    },
    takeTurnBtnFallback: {
        backgroundColor: Colors.core.card,
        borderRadius: 10,
        height: 56,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.core.border
    },
    takeTurnTxtFallback: {
        color: Colors.core.text,
        fontSize: 16,
        fontFamily: F.medium,
        letterSpacing: 0.3
    },
    serviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.core.card, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.core.border },
    serviceCardSelected: { borderColor: Colors.core.tint, backgroundColor: 'rgba(255,255,255,0.05)' },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.core.border, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
    checkboxSelected: { backgroundColor: Colors.core.tint, borderColor: Colors.core.tint },
    serviceName: { fontSize: 15, fontFamily: F.semibold, color: Colors.core.text, marginBottom: 2 },
    serviceNameSelected: { color: Colors.core.tint },
    serviceDuration: { fontSize: 13, fontFamily: F.regular, color: Colors.core.textSecondary },

});
