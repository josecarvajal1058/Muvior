import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, F } from '@/constants/theme';

const API_URL = Platform.OS === 'web'
    ? 'http://127.0.0.1:8000'
    : 'https://small-jeans-raise.loca.lt';

interface Service {
    id: number;
    name: string;
    capacity: number;
}

interface Employee {
    id: number;
    name: string;
    status: string;
}

interface Appointment {
    id: number;
    user_id: number | null;
    guest_name: string | null;
    status: string;
    user_name: string | null;
    current_service_id: number | null;
}

interface KanbanData {
    services: Service[];
    employees: Employee[];
    active_appointments: Appointment[];
}

export default function AdminDashboardScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [data, setData] = useState<KanbanData | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);

    const [isAddModalVisible, setIsAddModalVisible] = useState(false);
    const [guestName, setGuestName] = useState('');
    const [selectedServices, setSelectedServices] = useState<number[]>([]);
    const [addLoading, setAddLoading] = useState(false);

    const businessId = id || 1; // Fallback for dev

    const fetchKanban = async () => {
        try {
            const res = await fetch(`${API_URL}/businesses/${businessId}/kanban`, {
                headers: { 'Bypass-Tunnel-Reminder': 'true' }
            });
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.log('Error fetching kanban', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKanban();
        // Auto-refresh every 5 seconds
        const interval = setInterval(fetchKanban, 5000);
        return () => clearInterval(interval);
    }, [businessId]);

    const handleAdvance = async (appointmentId: number) => {
        setActionLoading(appointmentId);
        try {
            const res = await fetch(`${API_URL}/appointments/${appointmentId}/advance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                body: JSON.stringify({})
            });
            if (res.ok) {
                await fetchKanban();
            } else {
                const err = await res.json();
                Alert.alert("Error", err.detail || "No se pudo avanzar el turno");
                setActionLoading(null);
            }
        } catch (err) {
            Alert.alert("Error de conexión");
            setActionLoading(null);
        }
    };

    const handleAddWalkIn = async () => {
        if (!guestName.trim()) {
            Alert.alert("Aviso", "Por favor ingresa un nombre para el cliente.");
            return;
        }
        if (selectedServices.length === 0) {
            Alert.alert("Aviso", "Debes seleccionar al menos un servicio.");
            return;
        }

        setAddLoading(true);
        try {
            const res = await fetch(`${API_URL}/businesses/${businessId}/turn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                body: JSON.stringify({ guest_name: guestName.trim(), service_ids: selectedServices })
            });
            if (res.ok) {
                await fetchKanban();
                setIsAddModalVisible(false);
                setGuestName('');
                setSelectedServices([]);
            } else {
                const err = await res.json();
                Alert.alert("Error", err.detail || "No se pudo registrar al cliente");
            }
        } catch (err) {
            Alert.alert("Error de conexión");
        } finally {
            setAddLoading(false);
        }
    };

    const toggleService = (serviceId: number) => {
        setSelectedServices(prev =>
            prev.includes(serviceId) ? prev.filter(sid => sid !== serviceId) : [...prev, serviceId]
        );
    };

    if (loading && !data) {
        return (
            <View style={s.layout}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="chevron-back" size={24} color={Colors.core.text} />
                    </TouchableOpacity>
                    <Text style={s.headerTitle}>Cargando Tablero...</Text>
                    <View style={{ width: 40 }} />
                </View>
                <ActivityIndicator size="large" color={Colors.core.tint} style={{ marginTop: 100 }} />
            </View>
        );
    }

    if (!data) return null;

    return (
        <View style={s.layout}>
            <View style={s.header}>
                <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="chevron-back" size={24} color={Colors.core.text} />
                </TouchableOpacity>
                <Text style={s.headerTitle}>Panel de Empleados</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={s.scrollContent}>

                <View style={s.sectionHeader}>
                    <Text style={s.sectionTitle}>Empleados Activos</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}>
                    {data.employees.map(emp => (
                        <View key={emp.id} style={s.employeeCard}>
                            <View style={[s.statusIndicator, { backgroundColor: emp.status === 'DISPONIBLE' ? '#4CAF50' : '#FF5252' }]} />
                            <Text style={s.employeeName}>{emp.name}</Text>
                        </View>
                    ))}
                </ScrollView>

                <View style={[s.sectionHeader, { marginTop: 8 }]}>
                    <Text style={s.sectionTitle}>Estaciones de Servicio</Text>
                </View>

                {data.services.map(service => {
                    // Find appointments currently in this service
                    const clientsInService = data.active_appointments.filter(a => a.current_service_id === service.id);
                    const occupied = clientsInService.length;
                    const isFull = occupied >= service.capacity;

                    return (
                        <View key={service.id} style={s.stationCard}>
                            <View style={s.stationHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={s.iconCircle}>
                                        <Ionicons name="apps" size={20} color={Colors.core.text} />
                                    </View>
                                    <View>
                                        <Text style={s.stationName}>{service.name}</Text>
                                        <View style={s.statusPill}>
                                            <View style={[s.statusDot, { backgroundColor: isFull ? '#FF5252' : '#4CAF50' }]} />
                                            <Text style={s.statusTxt}>{isFull ? 'Ocupado' : 'Disponible'}</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={s.capacityBadge}>
                                    <Text style={s.capacityTxt}>{occupied} / {service.capacity}</Text>
                                </View>
                            </View>

                            {clientsInService.length > 0 && (
                                <View style={s.clientsList}>
                                    {clientsInService.map((client, idx) => (
                                        <View key={client.id} style={[s.clientRow, idx === clientsInService.length - 1 && { borderBottomWidth: 0 }]}>
                                            <View>
                                                <Text style={s.clientName}>{client.guest_name || client.user_name}</Text>
                                                <Text style={s.clientSubtitle}>{client.user_id ? 'Usuario App' : 'Walk-in'}</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={s.advanceBtn}
                                                activeOpacity={0.8}
                                                onPress={() => handleAdvance(client.id)}
                                                disabled={actionLoading === client.id}
                                            >
                                                {actionLoading === client.id ? (
                                                    <ActivityIndicator size="small" color="#000" />
                                                ) : (
                                                    <Text style={s.advanceBtnTxt}>Avanzar</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })}

                <View style={s.addButtonContainer}>
                    <TouchableOpacity style={s.addGhostBtn} onPress={() => setIsAddModalVisible(true)} activeOpacity={0.8}>
                        <Ionicons name="person-add" size={20} color={Colors.core.text} />
                        <Text style={s.addGhostBtnTxt}>Fichar Cliente Físico (Walk-in)</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            <Modal visible={isAddModalVisible} animationType="slide" transparent={true}>
                <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                        <View style={s.modalHeader}>
                            <Text style={s.modalTitle}>Nuevo Cliente (Walk-in)</Text>
                            <TouchableOpacity onPress={() => setIsAddModalVisible(false)} style={s.modalCloseBtn}>
                                <Ionicons name="close" size={24} color={Colors.core.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={s.inputLabel}>Nombre del cliente</Text>
                        <TextInput
                            style={s.input}
                            placeholder="Ej. Juan Pérez"
                            placeholderTextColor="#666"
                            value={guestName}
                            onChangeText={setGuestName}
                        />

                        <Text style={s.inputLabel}>Servicios a realizar</Text>
                        <ScrollView style={s.serviceListModal} showsVerticalScrollIndicator={false}>
                            {data.services.map(srv => {
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
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        <TouchableOpacity
                            style={s.submitGhostBtn}
                            activeOpacity={0.8}
                            onPress={handleAddWalkIn}
                            disabled={addLoading}
                        >
                            {addLoading ? (
                                <ActivityIndicator size="small" color="#000" />
                            ) : (
                                <Text style={s.submitGhostBtnTxt}>Registrar Cliente</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const s = StyleSheet.create({
    layout: { flex: 1, backgroundColor: Colors.core.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 60 : 36, paddingBottom: 16,
        borderBottomWidth: 1, borderBottomColor: Colors.core.border,
        backgroundColor: Colors.core.card
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontFamily: F.bold, color: Colors.core.text },

    scrollContent: { paddingBottom: 80 },

    sectionHeader: { paddingHorizontal: 24, paddingVertical: 16 },
    sectionTitle: { fontSize: 18, fontFamily: F.bold, color: Colors.core.text },

    employeeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.core.card, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 100, borderWidth: 1, borderColor: Colors.core.border, marginRight: 12 },
    statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    employeeName: { fontSize: 14, fontFamily: F.semibold, color: Colors.core.text },

    stationCard: { marginHorizontal: 24, marginBottom: 16, backgroundColor: Colors.core.card, borderRadius: 16, borderWidth: 1, borderColor: Colors.core.border, overflow: 'hidden' },
    stationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
    stationName: { fontSize: 16, fontFamily: F.bold, color: Colors.core.text, marginBottom: 4 },
    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    statusTxt: { fontSize: 12, fontFamily: F.medium, color: Colors.core.textSecondary },
    capacityBadge: { backgroundColor: Colors.core.tint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    capacityTxt: { fontSize: 16, fontFamily: F.bold, color: '#FFFFFF' },

    clientsList: { padding: 16 },
    clientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
    clientName: { fontSize: 15, fontFamily: F.semibold, color: Colors.core.text, marginBottom: 2 },
    clientSubtitle: { fontSize: 12, fontFamily: F.regular, color: Colors.core.tint },

    advanceBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 },
    advanceBtnTxt: { color: '#000000', fontSize: 13, fontFamily: F.bold },

    addButtonContainer: { paddingHorizontal: 24, marginTop: 12 },
    addGhostBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed', gap: 10 },
    addGhostBtnTxt: { color: Colors.core.text, fontSize: 15, fontFamily: F.semibold },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: Colors.core.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontFamily: F.bold, color: Colors.core.text },
    modalCloseBtn: { padding: 4 },
    inputLabel: { fontSize: 14, fontFamily: F.semibold, color: Colors.core.textSecondary, marginBottom: 8, marginTop: 16 },
    input: { backgroundColor: Colors.core.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.core.border, padding: 16, color: Colors.core.text, fontSize: 16, fontFamily: F.regular },
    serviceListModal: { maxHeight: 200, marginTop: 8 },
    serviceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.core.card, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: Colors.core.border },
    serviceCardSelected: { borderColor: Colors.core.tint, backgroundColor: 'rgba(255,255,255,0.05)' },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.core.border, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
    checkboxSelected: { backgroundColor: Colors.core.tint, borderColor: Colors.core.tint },
    serviceName: { fontSize: 15, fontFamily: F.semibold, color: Colors.core.text },
    serviceNameSelected: { color: Colors.core.tint },
    submitGhostBtn: { backgroundColor: '#FFFFFF', borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
    submitGhostBtnTxt: { color: '#000000', fontSize: 16, fontFamily: F.bold }
});
