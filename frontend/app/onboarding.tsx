import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, ScrollView,
    Animated, Platform, Modal, TextInput, Alert,
    NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, F, Palette } from '@/constants/theme';
import LocationPicker, { LocationSelection } from '@/components/LocationPicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Platform.OS === 'web'
    ? 'http://127.0.0.1:8000'
    : 'https://small-jeans-raise.loca.lt';

const CATEGORIES = [
    { id: 'barberia', label: 'Barbería' },
    { id: 'peluqueria', label: 'Peluquería y salón' },
    { id: 'unas', label: 'Manicura y pedicura' },
    { id: 'estetica', label: 'Estética facial y corporal' },
    { id: 'depilacion', label: 'Depilación, cejas y pestañas' },
    { id: 'spa', label: 'Spa y masajes' },
    { id: 'tatuajes', label: 'Tatuajes y piercings', age18: true },
    { id: 'mecanico', label: 'Taller mecánico' },
    { id: 'sastreria', label: 'Sastrería y arreglos' },
] as const;

const OWNER_TYPES = [
    { id: 'individual', label: 'Independiente' },
    { id: 'pequeno', label: 'Local de 1 a 3 personas' },
    { id: 'mediano', label: 'Local de 4 a 10 personas' },
] as const;

const DAYS = [
    { key: 'Lun', full: 'Lunes' },
    { key: 'Mar', full: 'Martes' },
    { key: 'Mié', full: 'Miércoles' },
    { key: 'Jue', full: 'Jueves' },
    { key: 'Vie', full: 'Viernes' },
    { key: 'Sáb', full: 'Sábado' },
    { key: 'Dom', full: 'Domingo' },
];

const H_LIST = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const M_LIST = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

const ITEM_H = 56;
const VISIBLE = 5;

function to24h(h12: number, am: boolean): number {
    if (am && h12 === 12) return 0;
    if (!am && h12 !== 12) return h12 + 12;
    return h12;
}
function from24h(h24: number): { h12: number; am: boolean } {
    if (h24 === 0) return { h12: 12, am: true };
    if (h24 < 12) return { h12: h24, am: true };
    if (h24 === 12) return { h12: 12, am: false };
    return { h12: h24 - 12, am: false };
}
function toTime(h: number, m: number) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function parseTime(t: string) {
    const [hStr = '09', mStr = '00'] = t.split(':');
    return { h: parseInt(hStr) || 9, m: parseInt(mStr) || 0 };
}
function fmtAMPM(t: string) {
    const { h, m } = parseTime(t);
    const { h12, am } = from24h(h);
    return `${h12}:${String(m).padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
}

type DrumColProps = {
    values: string[];
    selected: number;
    onChange: (i: number) => void;
};
type DrumHandle = { getIdx: () => number };

const DrumColumn = forwardRef<DrumHandle, DrumColProps>(function DrumColumn(
    { values, selected, onChange }, fwdRef
) {
    const scrollRef = useRef<ScrollView>(null);
    const liveRef = useRef(selected);
    const [visualIdx, setVisualIdx] = useState(selected);

    useImperativeHandle(fwdRef, () => ({ getIdx: () => liveRef.current }), []);

    useEffect(() => {
        scrollRef.current?.scrollTo({ y: selected * ITEM_H, animated: false });
        liveRef.current = selected;
        setVisualIdx(selected);
    }, []);

    const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const raw = e.nativeEvent.contentOffset.y;
        const idx = Math.max(0, Math.min(values.length - 1, Math.round(raw / ITEM_H)));
        if (liveRef.current !== idx) {
            liveRef.current = idx;
            setVisualIdx(idx);
            onChange(idx);
        }
    }, [values.length, onChange]);

    const onSnap = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const raw = e.nativeEvent.contentOffset.y;
        const idx = Math.max(0, Math.min(values.length - 1, Math.round(raw / ITEM_H)));
        liveRef.current = idx;
        setVisualIdx(idx);
        onChange(idx);
    }, [values.length, onChange]);

    return (
        <View style={col.wrap}>
            <View style={col.hili} pointerEvents="none" />
            <ScrollView
                ref={scrollRef}
                style={{ flex: 1 }}
                snapToInterval={ITEM_H}
                decelerationRate="fast"
                snapToAlignment="center"
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={onScroll}
                onMomentumScrollEnd={onSnap}
                onScrollEndDrag={onSnap}
                contentContainerStyle={{ paddingVertical: ITEM_H * Math.floor(VISIBLE / 2) }}
            >
                {values.map((v, i) => {
                    const dist = Math.abs(i - visualIdx);
                    const isCenter = dist === 0;
                    return (
                        <TouchableOpacity
                            key={v}
                            style={col.item}
                            onPress={() => {
                                scrollRef.current?.scrollTo({ y: i * ITEM_H, animated: true });
                                liveRef.current = i;
                                setVisualIdx(i);
                                onChange(i);
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                col.txt,
                                { opacity: dist === 0 ? 1 : dist === 1 ? 0.4 : 0.15 },
                                isCenter && col.txtSel,
                            ]}>
                                {v}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
});

const col = StyleSheet.create({
    wrap: { flex: 1, height: ITEM_H * VISIBLE, overflow: 'hidden', position: 'relative' },
    hili: {
        position: 'absolute',
        top: ITEM_H * Math.floor(VISIBLE / 2), left: 0, right: 0, height: ITEM_H,
        borderTopWidth: 1, borderBottomWidth: 1,
        borderColor: Colors.core.border,
        zIndex: 1,
    },
    item: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
    txt: { fontSize: 32, fontFamily: F.bold, color: Colors.core.textSecondary },
    txtSel: { color: Colors.core.text },
});

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
    const anim = useRef(new Animated.Value(on ? 1 : 0)).current;
    useEffect(() => {
        Animated.timing(anim, { toValue: on ? 1 : 0, duration: 200, useNativeDriver: false }).start();
    }, [on]);
    const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [Colors.core.border, Colors.core.tint] });
    const trans = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <Animated.View style={[tog.track, { backgroundColor: bg }]}>
                <Animated.View style={[tog.thumb, { transform: [{ translateX: trans }] }]} />
            </Animated.View>
        </TouchableOpacity>
    );
}
const tog = StyleSheet.create({
    track: { width: 46, height: 26, borderRadius: 13, justifyContent: 'center' },
    thumb: {
        width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff',
        shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 }, elevation: 2
    },
});

type DaySched = { active: boolean; start: string; end: string };
type Week = Record<string, DaySched>;
type PickerField = 'start' | 'end';

export default function OnboardingScreen() {
    const { role, birthdate, email, password, name } = useLocalSearchParams<{
        role: string;
        birthdate?: string;
        email?: string;
        password?: string;
        name?: string;
    }>();
    const [step, setStep] = useState(1);
    const [selItems, setSelItems] = useState<string[]>([]);
    const [clientLoc, setClientLoc] = useState<LocationSelection | null>(null);
    const [locPickerVisible, setLocPickerVisible] = useState(false);
    const [clientDist, setClientDist] = useState('');
    const [ownerType, setOwnerType] = useState('');
    const [ownerFlow, setOwnerFlow] = useState('');

    const isMinor = (() => {
        if (!birthdate) return false;
        const born = new Date(String(birthdate));
        const today = new Date();
        const age = today.getFullYear() - born.getFullYear() -
            (today < new Date(today.getFullYear(), born.getMonth(), born.getDate()) ? 1 : 0);
        return age < 18;
    })();

    const [week, setWeek] = useState<Week>({
        'Lunes': { active: true, start: '09:00', end: '18:00' },
        'Martes': { active: true, start: '09:00', end: '18:00' },
        'Miércoles': { active: true, start: '09:00', end: '18:00' },
        'Jueves': { active: true, start: '09:00', end: '18:00' },
        'Viernes': { active: true, start: '09:00', end: '18:00' },
        'Sábado': { active: true, start: '08:00', end: '13:00' },
        'Domingo': { active: false, start: '09:00', end: '17:00' },
    });

    const [pickerDay, setPickerDay] = useState<string | null>(null);
    const [pickerField, setPickerField] = useState<PickerField>('start');
    const [editHIdx, setEditHIdx] = useState(8);
    const [editMIdx, setEditMIdx] = useState(0);
    const [editAmIdx, setEditAmIdx] = useState(0);
    const [kbMode, setKbMode] = useState(false);
    const [kbH, setKbH] = useState('');
    const [kbM, setKbM] = useState('');
    const [isFinishing, setIsFinishing] = useState(false);

    const drumHRef = useRef<{ getIdx: () => number }>(null);
    const drumMRef = useRef<{ getIdx: () => number }>(null);
    const drumAmRef = useRef<{ getIdx: () => number }>(null);

    const [fadeAnim] = useState(new Animated.Value(1));
    const isClient = role === 'cliente';
    const totalSteps = 2;

    const openPicker = (day: string, field: PickerField) => {
        const t = week[day][field];
        const { h, m } = parseTime(t);
        const { h12, am } = from24h(h);
        const mRound = Math.round(m / 5) * 5 % 60;
        setEditHIdx(h12 - 1);
        setEditMIdx(M_LIST.indexOf(String(mRound).padStart(2, '0')));
        setEditAmIdx(am ? 0 : 1);
        setKbH(String(h12).padStart(2, '0'));
        setKbM(String(mRound).padStart(2, '0'));
        setKbMode(false);
        setPickerDay(day);
        setPickerField(field);
    };

    const closePicker = () => { setPickerDay(null); setKbMode(false); };

    const currentTime = (): string => {
        if (kbMode) {
            let h12 = parseInt(kbH || '12') || 12;
            if (h12 > 12) h12 = 12;
            if (h12 < 1) h12 = 1;
            let m = parseInt(kbM || '0') || 0;
            if (m > 59) m = 59;
            const amIdx = drumAmRef.current?.getIdx() ?? editAmIdx;
            return toTime(to24h(h12, amIdx === 0), m);
        }
        const hIdx = drumHRef.current?.getIdx() ?? editHIdx;
        const mIdx = drumMRef.current?.getIdx() ?? editMIdx;
        const amIdx = drumAmRef.current?.getIdx() ?? editAmIdx;
        const h12 = parseInt(H_LIST[hIdx]);
        const h24 = to24h(h12, amIdx === 0);
        const m = parseInt(M_LIST[mIdx]);
        return toTime(h24, m);
    };

    const applyOne = () => {
        if (!pickerDay) return;
        setWeek(prev => ({ ...prev, [pickerDay]: { ...prev[pickerDay], [pickerField]: currentTime() } }));
        closePicker();
    };

    const applyAll = () => {
        const t = currentTime();
        setWeek(prev => {
            const next = { ...prev };
            DAYS.forEach(({ full }) => { if (next[full].active) next[full] = { ...next[full], [pickerField]: t }; });
            return next;
        });
        closePicker();
    };

    const toggleDay = (full: string) =>
        setWeek(prev => ({ ...prev, [full]: { ...prev[full], active: !prev[full].active } }));

    const toggleItem = (id: string) =>
        setSelItems(prev => isClient
            ? (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
            : [id]);

    const canNext = isClient
        ? (step === 1 ? (clientLoc !== null && clientLoc.province !== null && clientDist !== '') : (selItems.length > 0))
        : (step === 1 ? (ownerType !== '' && ownerFlow !== '') : Object.values(week).some(d => d.active));

    const nextStep = () => {
        if (!canNext) return;
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(async () => {
            if (step < totalSteps) {
                setStep(s => s + 1);
                Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
            } else {
                setIsFinishing(true);
                // Nota técnica: POST final para persistencia de usuario.
                try {
                    const res = await fetch(`${API_URL}/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                        body: JSON.stringify({
                            email: email || '',
                            password: password || '',
                            name: name || 'Usuario',
                            role: role || 'cliente'
                        }),
                    });
                    const data = await res.json();
                    if (res.ok && data.user_id) {
                        await AsyncStorage.setItem('user_id', String(data.user_id));
                        await AsyncStorage.setItem('user_role', data.role);
                    }
                } catch (err) {
                    console.log('Error registrering user:', err);
                }

                setTimeout(() => {
                    router.replace('/(tabs)');
                }, 1000);
            }
        });
    };

    const toggleCat = (id: string, age18 = false) => {
        if (age18) {
            if (isMinor) {
                Alert.alert('Acceso Restringido', 'Debes ser mayor de 18 años.');
            } else {
                Alert.alert('Servicio +18', 'Este servicio está reservado para mayores de edad.', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Continuar', onPress: () => toggleItem(id) },
                ]);
            }
        } else {
            toggleItem(id);
        }
    };

    const renderStep1Client = () => (
        <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={s.title}>¿Dónde te encuentras?</Text>
            <Text style={s.subtitle}>Para mostrarte negocios cerca de ti.</Text>

            <View style={s.fieldWrap}>
                <Ionicons name="location-outline" size={20} color={Colors.core.textSecondary} style={{ marginRight: 12 }} />
                <TouchableOpacity
                    style={{ flex: 1, justifyContent: 'center' }}
                    onPress={() => setLocPickerVisible(true)}
                >
                    <Text style={[s.input, !clientLoc && { color: Colors.core.textSecondary }]}>
                        {clientLoc ? `${clientLoc.sector ? clientLoc.sector.name + ', ' : ''}${clientLoc.municipality?.name}, ${clientLoc.province?.name}` : 'Provincia, Ciudad o Barrio...'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: 28 }} />
            <Text style={[{ marginBottom: 12, color: Colors.core.text, fontFamily: F.semibold, fontSize: 16 }]}>¿Hasta dónde viajarías?</Text>
            <View style={s.optList}>
                {['Menos de 2 km', 'Distrito completo', 'Toda la ciudad'].map(opt => {
                    const sel = clientDist === opt;
                    return (
                        <TouchableOpacity key={opt} style={[s.optItem, sel && s.optItemSel, { paddingVertical: 18 }]} onPress={() => setClientDist(opt)}>
                            <Text style={[s.optTxt, { fontSize: 15 }]}>{opt}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Animated.View>
    );

    const renderStep2Client = () => (
        <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={s.title}>¿Qué buscas?</Text>
            <Text style={s.subtitle}>Tus servicios preferidos y cómo los quieres.</Text>

            <Text style={[{ marginBottom: 12, color: Colors.core.text, fontFamily: F.semibold }]}>Servicios (puedes elegir varios)</Text>
            <View style={s.grid}>
                {CATEGORIES.map(item => {
                    const sel = selItems.includes(item.id);
                    return (
                        <TouchableOpacity key={item.id}
                            style={[s.chip, sel && s.chipSel]}
                            onPress={() => toggleCat(item.id, 'age18' in item ? item.age18 : false)}
                            activeOpacity={0.75}
                        >
                            {'age18' in item && item.age18 && (
                                <View style={s.ageBadge}><Text style={s.ageBadgeTxt}>+18</Text></View>
                            )}
                            <Text style={[s.chipTxt]}>{item.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

        </Animated.View>
    );

    const renderStep1Owner = () => (
        <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={s.title}>Tamaño de operación</Text>
            <Text style={s.subtitle}>Ayúdanos a preparar tu agenda.</Text>

            <Text style={[{ marginBottom: 12, color: Colors.core.text, fontFamily: F.semibold }]}>¿Cuántas personas trabajan?</Text>
            <View style={s.optList}>
                {OWNER_TYPES.map(item => {
                    const sel = ownerType === item.id;
                    return (
                        <TouchableOpacity key={item.id} style={[s.optItem, sel && s.optItemSel, { paddingVertical: 18 }]} onPress={() => setOwnerType(item.id)}>
                            <Text style={[s.optTxt, { fontSize: 15 }]}>{item.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={{ height: 28 }} />
            <Text style={[{ marginBottom: 12, color: Colors.core.text, fontFamily: F.semibold }]}>Flujo de clientes diario esperado</Text>
            <View style={s.optList}>
                {['Menos de 10', 'De 10 a 30', 'Más de 50'].map(opt => {
                    const sel = ownerFlow === opt;
                    return (
                        <TouchableOpacity key={opt} style={[s.optItem, sel && s.optItemSel, { paddingVertical: 18 }]} onPress={() => setOwnerFlow(opt)}>
                            <Text style={[s.optTxt, { fontSize: 15 }]}>{opt}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Animated.View>
    );

    const renderSchedule = () => (
        <Animated.View style={{ opacity: fadeAnim }}>
            <Text style={s.title}>Horario</Text>
            <Text style={s.subtitle}>Activa los días y personaliza las horas.</Text>
            <View style={s.dayList}>
                {DAYS.map(({ full }) => {
                    const d = week[full];
                    return (
                        <View key={full} style={[s.dayCard, !d.active && { opacity: 0.45 }]}>
                            <Text style={[s.dayName, !d.active && s.dayNameOff]}>{full}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                {d.active && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <TouchableOpacity style={s.timeBox} onPress={() => openPicker(full, 'start')}>
                                            <Text style={s.timeTxt}>{fmtAMPM(d.start)}</Text>
                                        </TouchableOpacity>
                                        <Text style={{ color: Colors.core.textSecondary }}>-</Text>
                                        <TouchableOpacity style={s.timeBox} onPress={() => openPicker(full, 'end')}>
                                            <Text style={s.timeTxt}>{fmtAMPM(d.end)}</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                <Toggle on={d.active} onPress={() => toggleDay(full)} />
                            </View>
                        </View>
                    );
                })}
            </View>
        </Animated.View>
    );

    const content = () => {
        if (isClient) return step === 1 ? renderStep1Client() : renderStep2Client();
        return step === 1 ? renderStep1Owner() : renderSchedule();
    };

    return (
        <View style={s.root}>
            <View style={s.header}>
                <View style={s.headerSide}>
                    <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                        <Ionicons name="chevron-back" size={24} color={Colors.core.text} />
                    </TouchableOpacity>
                </View>
                <View style={s.headerCenter}>
                    <Text style={s.headerTxt}>{isClient ? 'Tu cuenta' : 'Tu negocio'}</Text>
                </View>
                <View style={s.headerSide} />
            </View>

            <ScrollView contentContainerStyle={s.scroll}>{content()}</ScrollView>

            <View style={s.footer}>
                <View style={s.progressBg}>
                    <View style={[s.progressFg, { width: `${(step / totalSteps) * 100}%` as any }]} />
                </View>
                <TouchableOpacity style={[s.nextBtn, !canNext && s.nextBtnOff]} onPress={nextStep}>
                    <Text style={s.nextTxt}>{step === totalSteps ? 'Finalizar' : 'Siguiente'}</Text>
                </TouchableOpacity>
            </View>

            <LocationPicker
                visible={locPickerVisible}
                onClose={() => setLocPickerVisible(false)}
                onSelect={setClientLoc}
            />

            <Modal transparent visible={!!pickerDay} animationType="fade" onRequestClose={closePicker}>
                <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={closePicker} />
                <View style={s.sheet}>
                    <View style={s.handle} />
                    <View style={s.sheetHead}>
                        <View>
                            <Text style={s.sheetDay}>{pickerDay}</Text>
                            <Text style={s.sheetField}>{pickerField === 'start' ? 'Apertura' : 'Cierre'}</Text>
                        </View>
                        <TouchableOpacity style={[s.kbBtn, kbMode && s.kbBtnOn]} onPress={() => setKbMode(!kbMode)}>
                            <Ionicons name="keypad-outline" size={20} color={Colors.core.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={s.modeContainer}>
                        {!kbMode && <Text style={s.drumPreview}>{fmtAMPM(currentTime())}</Text>}
                        {kbMode && <View style={{ height: 20 }} />}

                        <View style={s.drumRow}>
                            <View style={col.wrap}>
                                <View style={col.hili} pointerEvents="none" />
                                {kbMode ? (
                                    <View style={[col.item, { position: 'absolute', top: ITEM_H * 2, left: 0, right: 0 }]}>
                                        <TextInput
                                            style={[col.txt, col.txtSel, { textAlign: 'center', width: '100%', padding: 0 }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                                            value={kbH}
                                            onChangeText={setKbH}
                                            keyboardType="numeric"
                                            maxLength={2}
                                            placeholder="09"
                                            placeholderTextColor={Palette.gray600}
                                            autoFocus
                                        />
                                    </View>
                                ) : (
                                    <DrumColumn ref={drumHRef} values={H_LIST} selected={editHIdx} onChange={setEditHIdx} />
                                )}
                            </View>
                            <Text style={s.drumColon}>:</Text>
                            <View style={col.wrap}>
                                <View style={col.hili} pointerEvents="none" />
                                {kbMode ? (
                                    <View style={[col.item, { position: 'absolute', top: ITEM_H * 2, left: 0, right: 0 }]}>
                                        <TextInput
                                            style={[col.txt, col.txtSel, { textAlign: 'center', width: '100%', padding: 0 }, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                                            value={kbM}
                                            onChangeText={setKbM}
                                            keyboardType="numeric"
                                            maxLength={2}
                                            placeholder="00"
                                            placeholderTextColor={Palette.gray600}
                                        />
                                    </View>
                                ) : (
                                    <DrumColumn ref={drumMRef} values={M_LIST} selected={editMIdx} onChange={setEditMIdx} />
                                )}
                            </View>
                            <View style={{ width: 10 }} />
                            <DrumColumn ref={drumAmRef} values={['AM', 'PM']} selected={editAmIdx} onChange={setEditAmIdx} />
                        </View>
                    </View>

                    <View style={s.actionRow}>
                        <TouchableOpacity style={s.btnSec} onPress={applyOne}><Text style={s.btnSecTxt}>Aceptar</Text></TouchableOpacity>
                        <TouchableOpacity style={s.btnPri} onPress={applyAll}><Text style={s.btnPriTxt}>Aceptar todos</Text></TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {isFinishing && (
                <View style={s.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.core.tint} />
                    <Text style={s.loadingText}>Preparando tu inicio...</Text>
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.core.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 60 : 40, marginBottom: 4 },
    headerSide: { width: 40, alignItems: 'flex-start' },
    headerCenter: { flex: 1, alignItems: 'center' },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.core.card, alignItems: 'center', justifyContent: 'center' },
    headerTxt: { fontFamily: F.semibold, fontSize: 16, color: Colors.core.text, textAlign: 'center' },
    scroll: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 140 },
    title: { fontSize: 30, fontFamily: F.bold, color: Colors.core.text, letterSpacing: -0.5, marginBottom: 4 },
    subtitle: { fontSize: 14, fontFamily: F.regular, color: Colors.core.textSecondary, lineHeight: 22, marginBottom: 24 },
    fieldWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.core.card, borderRadius: 12, paddingHorizontal: 16, height: 56, borderWidth: 1, borderColor: 'transparent' },
    input: { flex: 1, fontSize: 16, fontFamily: F.medium, color: Colors.core.text },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
    chip: {
        width: '48%',
        paddingTop: 16, paddingBottom: 12, paddingHorizontal: 8,
        borderRadius: 12, backgroundColor: Colors.core.card,
        borderWidth: 1.2, borderColor: 'transparent',
        alignItems: 'center', justifyContent: 'center', minHeight: 74
    },
    chipSel: { borderColor: Colors.core.tint },
    chipTxt: { fontFamily: F.medium, color: Colors.core.text, fontSize: 13, textAlign: 'center', lineHeight: 18 },
    ageBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: Colors.core.border, borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1.5 },
    ageBadgeTxt: { fontFamily: F.bold, fontSize: 8, color: Colors.core.textSecondary, letterSpacing: 0.2 },
    optList: { gap: 14 },
    optItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 22, borderRadius: 12, backgroundColor: Colors.core.card, borderWidth: 1, borderColor: 'transparent' },
    optItemSel: { borderColor: Colors.core.tint },
    optTxt: { fontFamily: F.semibold, color: Colors.core.text, fontSize: 16 },
    dayList: { gap: 10 },
    dayCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.core.card, borderRadius: 14, paddingVertical: 18, paddingHorizontal: 20, minHeight: 74 },
    dayName: { fontFamily: F.semibold, color: Colors.core.text, fontSize: 16 },
    dayNameOff: { color: Colors.core.textSecondary },
    timeBox: { backgroundColor: Colors.core.border, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
    timeTxt: { fontFamily: F.bold, color: Colors.core.text, fontSize: 13, letterSpacing: 0.5 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, paddingBottom: Platform.OS === 'ios' ? 40 : 20, backgroundColor: Colors.core.background, borderTopWidth: 1, borderTopColor: Colors.core.border },
    progressBg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: Colors.core.card, overflow: 'hidden' },
    progressFg: { height: '100%', backgroundColor: Colors.core.tint, borderRadius: 2 },
    nextBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.core.tint, paddingVertical: 18, paddingHorizontal: 22, borderRadius: 10 },
    nextBtnOff: { opacity: 0.35 },
    nextTxt: { fontFamily: F.bold, color: '#fff', fontSize: 15 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
    sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.core.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 44 : 28 },
    handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.core.border, marginBottom: 24 },
    sheetHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
    sheetDay: { fontFamily: F.bold, fontSize: 20, color: Colors.core.text },
    sheetField: { fontFamily: F.regular, fontSize: 13, color: Colors.core.textSecondary, marginTop: 2 },
    kbBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.core.background, borderWidth: 1, borderColor: Colors.core.border, alignItems: 'center', justifyContent: 'center' },
    kbBtnOn: { borderColor: Colors.core.tint },
    drumPreview: { textAlign: 'center', fontSize: 40, fontFamily: F.bold, color: Colors.core.text, marginBottom: 20, fontVariant: ['tabular-nums'] },
    modeContainer: { minHeight: ITEM_H * VISIBLE },
    drumRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    drumColon: { fontSize: 28, color: Colors.core.textSecondary, fontFamily: F.bold, marginHorizontal: 15 },
    actionRow: { flexDirection: 'row', gap: 12 },
    btnSec: { flex: 1, paddingVertical: 18, borderRadius: 12, alignItems: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.core.border },
    btnSecTxt: { fontFamily: F.semibold, color: Colors.core.text, fontSize: 15 },
    btnPri: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, borderRadius: 12, backgroundColor: Colors.core.tint },
    btnPriTxt: { fontFamily: F.bold, color: '#fff', fontSize: 15 },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.core.background,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99,
    },
    loadingText: {
        fontFamily: F.medium,
        color: Colors.core.text,
        marginTop: 16,
        fontSize: 16,
    },
});
