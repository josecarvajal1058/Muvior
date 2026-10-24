import React, { useState, useRef } from 'react';
import {
    StyleSheet, View, Text, TextInput, TouchableOpacity,
    ScrollView, Platform, Alert, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, F } from '@/constants/theme';
import LocationPicker, { LocationSelection } from '@/components/LocationPicker';
import DatePickerModal from '@/components/DatePickerModal';
import PhoneField from '@/components/PhoneField';

type Role = 'cliente' | 'dueño' | null;

type PersonalData = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirm: string;
    birthdate: string;
};

type BusinessData = {
    businessName: string;
    address: string;
    googleMapsLink: string;
    document: string;
    instagram: string;
    categoryId: string;
    customCategoryName: string;
};

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
    { id: 'otro', label: 'Otro' },
] as const;

type FieldProps = {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    secure?: boolean;
    keyboard?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
    icon?: keyof typeof Ionicons.glyphMap;
    optional?: boolean;
    hint?: string;
    maxLength?: number;
};

function Field({
    label, value, onChange, placeholder, secure = false,
    keyboard = 'default', icon, optional, hint, maxLength,
}: FieldProps) {
    const [focused, setFocused] = useState(false);
    const [showPass, setShowPass] = useState(false);

    return (
        <View style={f.wrap}>
            <View style={f.labelRow}>
                <Text style={f.label}>{label}</Text>
                {optional && <Text style={f.optional}>Opcional</Text>}
            </View>

            <View style={[f.box, focused && f.boxFocus]}>
                {icon && <Ionicons name={icon} size={18} color={focused ? Colors.core.tint : Colors.core.textSecondary} style={f.icon} />}
                <TextInput
                    style={[f.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                    value={value}
                    onChangeText={onChange}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.core.textSecondary}
                    secureTextEntry={secure && !showPass}
                    keyboardType={keyboard}
                    autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    maxLength={maxLength}
                />
                {secure && (
                    <TouchableOpacity onPress={() => setShowPass(v => !v)} style={f.eye}>
                        <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.core.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>
            {hint && <Text style={f.hint}>{hint}</Text>}
        </View>
    );
}

const f = StyleSheet.create({
    wrap: { marginBottom: 18 },
    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    label: { fontSize: 11, fontWeight: '700', fontFamily: F.semibold, letterSpacing: 1.4, color: Colors.core.text, textTransform: 'uppercase' },
    optional: { fontSize: 10, color: Colors.core.textSecondary, fontWeight: '500', fontFamily: F.medium, marginLeft: 4 },
    box: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: Colors.core.card,
        borderRadius: 10, borderWidth: 1, borderColor: Colors.core.border,
        paddingHorizontal: 14, height: 52,
    },
    boxFocus: { borderColor: Colors.core.tint },
    icon: { marginRight: 10 },
    input: { flex: 1, color: Colors.core.text, fontSize: 15, fontFamily: F.regular },
    eye: { padding: 4 },
    hint: { fontSize: 11, fontFamily: F.regular, color: Colors.core.textSecondary, marginTop: 4, marginLeft: 2 },
});

function isPersonalEmpty(d: PersonalData) {
    return !d.firstName && !d.lastName && !d.email && !d.phone && !d.password && !d.confirm;
}
function isBusinessEmpty(d: BusinessData, loc: LocationSelection | null) {
    return !d.address && !d.document && !d.googleMapsLink && !loc;
}

function validatePersonal(d: PersonalData): string | null {
    if (!d.firstName.trim()) return 'Ingresa tu nombre.';
    if (!d.lastName.trim()) return 'Ingresa tu apellido.';
    if (!d.email.trim() || !d.email.includes('@')) return 'Correo inválido.';
    const digits = d.phone.replace(/\D/g, '');
    if (digits.length < 10) return 'Teléfono inválido. Ej: +1 809 000 0000';
    if (d.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
    if (d.password !== d.confirm) return 'Las contraseñas no coinciden.';
    return null;
}

function validateBusiness(d: BusinessData, loc: LocationSelection | null): string | null {
    if (!loc || !loc.province || !loc.municipality) return 'Ingresa la provincia y el municipio.';
    if (!d.address.trim()) return 'Ingresa tu calle, número y sector.';
    if (!d.document.trim()) return 'Ingresa tu cédula o RNC.';
    return null;
}

export default function RegisterScreen() {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<Role>(null);

    const [personal, setPersonal] = useState<PersonalData>({
        firstName: '', lastName: '',
        email: '', phone: '',
        password: '', confirm: '',
        birthdate: '',
    });

    const [business, setBusiness] = useState<BusinessData>({
        businessName: '', address: '', googleMapsLink: '', document: '', instagram: '', categoryId: '', customCategoryName: '',
    });
    const [businessLoc, setBusinessLoc] = useState<LocationSelection | null>(null);
    const [locPickerVisible, setLocPickerVisible] = useState(false);
    const [datePickerVisible, setDatePickerVisible] = useState(false);

    const scrollRef = useRef<ScrollView>(null);

    const totalSteps = role === 'dueño' ? 7 : 5;

    const setP = (key: keyof PersonalData) => (v: string) =>
        setPersonal(prev => ({ ...prev, [key]: v }));

    const setB = (key: keyof BusinessData) => (v: string) =>
        setBusiness(prev => ({ ...prev, [key]: v }));

    const goBack = () => {
        if (step === 1) { router.back(); return; }
        setStep(s => s - 1);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    };

    const goNext = () => {
        const DEV_SKIP_VALIDATION = true;

        if (step === 1) {
            if (!role) {
                setRole('cliente');
            }
            setStep(2);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }

        if (DEV_SKIP_VALIDATION) {
            if (step === totalSteps) {
                router.push({
                    pathname: '/onboarding',
                    params: {
                        role: role ?? 'cliente',
                        birthdate: personal.birthdate || '2000-01-01',
                        email: personal.email,
                        password: personal.password,
                        name: `${personal.firstName} ${personal.lastName}`
                    }
                });
                return;
            }
            setStep((prev) => prev < totalSteps ? prev + 1 : prev);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }
        if (step === 2) {
            if (!isPersonalEmpty(personal)) {
                if (!personal.firstName.trim() || !personal.lastName.trim()) {
                    Alert.alert('Datos incompletos', 'Ingresa tu nombre y apellido.');
                    return;
                }
            }
            setStep(3);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }
        if (step === 3) {
            if (!isPersonalEmpty(personal)) {
                if (!personal.birthdate.trim() || personal.birthdate.length < 10) {
                    Alert.alert('Fecha requerida', 'Ingresa tu fecha de nacimiento completa (AAAA-MM-DD).');
                    return;
                }
            }
            setStep(4);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }
        if (step === 4) {
            if (!isPersonalEmpty(personal)) {
                if (!personal.email.trim() || !personal.email.includes('@')) {
                    Alert.alert('Datos incorrectos', 'Ingresa un correo electrónico válido.');
                    return;
                }
                const digits = personal.phone.replace(/\D/g, '');
                if (digits.length < 10) {
                    Alert.alert('Datos incorrectos', 'Ingresa un número de teléfono válido.');
                    return;
                }
            }
            setStep(5);
            scrollRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }
        if (step === 5) {
            if (!isPersonalEmpty(personal)) {
                if (personal.password.length < 8) {
                    Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 8 caracteres.');
                    return;
                }
                if (personal.password !== personal.confirm) {
                    Alert.alert('Error', 'Las contraseñas no coinciden.');
                    return;
                }
            }
            if (role === 'dueño') {
                setStep(6);
                scrollRef.current?.scrollTo({ y: 0, animated: true });
                return;
            }
            router.push({
                pathname: '/onboarding',
                params: {
                    role: role ?? 'cliente',
                    birthdate: personal.birthdate,
                    email: personal.email,
                    password: personal.password,
                    name: `${personal.firstName} ${personal.lastName}`
                }
            });
            return;
        }
        if (step === 6) {
            if (role === 'dueño') {
                if (!business.businessName.trim()) {
                    Alert.alert('Nombre requerido', 'Ingresa el nombre del negocio.');
                    return;
                }
                if (!business.categoryId) {
                    Alert.alert('Selecciona una categoría', 'Indícanos cuál es tu tipo de negocio.');
                    return;
                }
                setStep(7);
                scrollRef.current?.scrollTo({ y: 0, animated: true });
                return;
            }
        }
        if (step === 7) {
            if (!isBusinessEmpty(business, businessLoc)) {
                const err = validateBusiness(business, businessLoc);
                if (err) { Alert.alert('Revisa los datos', err); return; }
            }
            router.push({
                pathname: '/onboarding',
                params: {
                    role: role ?? 'dueño',
                    birthdate: personal.birthdate,
                    email: personal.email,
                    password: personal.password,
                    name: `${personal.firstName} ${personal.lastName}`
                }
            });
        }
    };

    const renderStep1 = () => (
        <>
            <Text style={s.title}>Crear cuenta</Text>
            <Text style={s.subtitle}>¿Cómo vas a usar Muvior?</Text>

            <View style={s.roleCards}>
                <TouchableOpacity
                    style={[s.roleCard, role === 'cliente' && s.roleCardSel]}
                    onPress={() => setRole('cliente')}
                    activeOpacity={0.8}
                >
                    <View style={[s.roleIcon, role === 'cliente' && s.roleIconSel]}>
                        <Ionicons name="person" size={28} color={Colors.core.textSecondary} />
                    </View>
                    <Text style={[s.roleTitle]}>Cliente</Text>
                    <Text style={s.roleDesc}>Busca locales, reserva citas y gestiona tus turnos.</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[s.roleCard, role === 'dueño' && s.roleCardSel]}
                    onPress={() => setRole('dueño')}
                    activeOpacity={0.8}
                >
                    <View style={[s.roleIcon, role === 'dueño' && s.roleIconSel]}>
                        <Ionicons name="storefront" size={28} color={Colors.core.textSecondary} />
                    </View>
                    <Text style={[s.roleTitle]}>Dueño de negocio</Text>
                    <Text style={s.roleDesc}>Administra tu local, clientes y agenda en un solo lugar.</Text>
                </TouchableOpacity>
            </View>
        </>
    );

    const renderStep2 = () => (
        <>
            <Text style={s.title}>¿Cómo te llamas?</Text>
            <Text style={s.subtitle}>Queremos saber cómo dirigirnos a ti.</Text>

            <Field label="Nombre" value={personal.firstName} onChange={setP('firstName')} placeholder="José" icon="person-outline" />
            <Field label="Apellido" value={personal.lastName} onChange={setP('lastName')} placeholder="García" icon="person-outline" />
        </>
    );

    const renderStep3 = () => (
        <>
            <Text style={s.title}>Fecha de nacimiento</Text>
            <Text style={s.subtitle}>Información privada, solo visible para ti.</Text>

            <TouchableOpacity
                style={s.fieldWrap}
                onPress={() => setDatePickerVisible(true)}
                activeOpacity={0.8}
            >
                <Ionicons name="calendar-outline" size={20} color={Colors.core.textSecondary} style={{ marginRight: 12 }} />
                <Text style={[s.input, !personal.birthdate && { color: Colors.core.textSecondary }]}>
                    {personal.birthdate || "AAAA-MM-DD"}
                </Text>
            </TouchableOpacity>
        </>
    );

    const renderStep4 = () => (
        <>
            <Text style={s.title}>Tus datos de contacto</Text>
            <Text style={s.subtitle}>Tu teléfono principal y correo electrónico.</Text>

            <Field
                label="Correo electrónico"
                value={personal.email}
                onChange={setP('email')}
                placeholder="usuario@correo.com"
                keyboard="email-address"
                icon="mail-outline"
            />
            <PhoneField
                label="Número de teléfono"
                value={personal.phone}
                onChange={setP('phone')}
            />
        </>
    );

    const renderStep5 = () => (
        <>
            <Text style={s.title}>Crea una contraseña</Text>
            <Text style={s.subtitle}>Asegúrate de que sea fácil de recordar pero segura.</Text>

            <Field
                label="Contraseña"
                value={personal.password}
                onChange={setP('password')}
                placeholder="Mínimo 8 caracteres"
                secure
                icon="lock-closed-outline"
            />
            <Field
                label="Confirmar contraseña"
                value={personal.confirm}
                onChange={setP('confirm')}
                placeholder="Repite tu contraseña"
                secure
                icon="shield-outline"
            />
        </>
    );

    const renderStep6 = () => (
        <>
            <Text style={s.title}>¿De qué trata tu negocio?</Text>
            <Text style={s.subtitle}>Cuéntanos cómo se llama y su categoría principal.</Text>

            <Field
                label="Nombre del negocio"
                value={business.businessName}
                onChange={setB('businessName')}
                placeholder="Ej. Barbería El Rey"
                icon="storefront-outline"
            />

            <View style={{ height: 16 }} />
            <Text style={[f.label, { marginBottom: -2 }]}>Categoría principal</Text>
            <View style={s.grid}>
                {CATEGORIES.map(item => {
                    const sel = business.categoryId === item.id;
                    return (
                        <TouchableOpacity key={item.id}
                            style={[s.chip, sel && s.chipSel]}
                            onPress={() => setB('categoryId')(item.id)}
                            activeOpacity={0.75}
                        >
                            {'age18' in item && item.age18 && (
                                <View style={s.ageBadge}>
                                    <Text style={s.ageBadgeTxt}>+18</Text>
                                </View>
                            )}
                            <Text style={[s.chipTxt]}>{item.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {business.categoryId === 'otro' && (
                <View style={s.customCatWrap}>
                    <View style={s.customCatHeader}>
                        <Text style={s.customCatLabel}>¿Cuál es tu tipo de negocio?</Text>
                        <Text style={s.customCatOpt}>(Opcional)</Text>
                    </View>
                    <TextInput
                        style={s.customCatInput}
                        placeholder="Ej. Barbería móvil, Tienda de mascotas..."
                        placeholderTextColor={Colors.core.textSecondary}
                        value={business.customCategoryName}
                        onChangeText={setB('customCategoryName')}
                    />
                </View>
            )}
        </>
    );

    const renderStep7 = () => (
        <>
            <Text style={s.title}>Ubicación y verificación</Text>
            <Text style={s.subtitle}>Información para que tus clientes te encuentren.</Text>

            <Text style={[f.label, { marginBottom: 8, marginTop: 4 }]}>PROVINCIA Y MUNICIPIO</Text>
            <TouchableOpacity
                style={[f.box, { marginBottom: 18 }]}
                onPress={() => setLocPickerVisible(true)}
                activeOpacity={0.7}
            >
                <Ionicons name="location-outline" size={18} color={Colors.core.textSecondary} style={f.icon} />
                <Text style={[f.input, !businessLoc && { color: Colors.core.textSecondary }]}>
                    {businessLoc ? `${businessLoc.municipality?.name}, ${businessLoc.province?.name}` : 'Seleccionar Zona...'}
                </Text>
            </TouchableOpacity>

            <Field
                label="Dirección exacta"
                value={business.address}
                onChange={setB('address')}
                placeholder="Calle, Res., local o Plaza"
                icon="home-outline"
                hint="Dirección específica donde atienden al público"
            />
            <Field
                label="Enlace de Google Maps / Waze"
                value={business.googleMapsLink}
                onChange={setB('googleMapsLink')}
                placeholder="https://maps.app.goo.gl/..."
                icon="map-outline"
                optional
                hint="Compartir ubicación mejora que los clientes te encuentren"
            />
            <Field
                label="Cédula o RNC del negocio"
                value={business.document}
                onChange={setB('document')}
                placeholder="J-12345678-9  o  V-12345678"
                keyboard="default"
                icon="document-text-outline"
                hint="Número de identificación fiscal o cédula del titular"
            />
            <Field
                label="Instagram del negocio"
                value={business.instagram}
                onChange={setB('instagram')}
                placeholder="@tunegocio"
                icon="logo-instagram"
                optional
                hint="Ayuda a los clientes a encontrarte antes de visitar"
            />
        </>
    );

    const renderContent = () => {
        switch (step) {
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            case 5: return renderStep5();
            case 6: return renderStep6();
            case 7: return renderStep7();
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: Colors.core.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={s.root}>
                <View style={s.header}>
                    <TouchableOpacity style={s.backBtn} onPress={goBack}>
                        <Ionicons name="chevron-back" size={24} color={Colors.core.text} />
                    </TouchableOpacity>

                    <View style={s.steps}>
                        {Array.from({ length: totalSteps }).map((_, i) => (
                            <View key={i} style={[s.stepDot, i < step && s.stepDotDone, i === step - 1 && s.stepDotActive]} />
                        ))}
                    </View>

                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={s.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {renderContent()}
                </ScrollView>

                <View style={s.footer}>
                    <TouchableOpacity style={s.nextBtn} onPress={goNext} activeOpacity={0.85}>
                        <Text style={s.nextTxt}>
                            {step === totalSteps ? 'Continuar a preferencias' : 'Siguiente'}
                        </Text>
                    </TouchableOpacity>

                    {step === 1 && (
                        <TouchableOpacity onPress={() => router.back()} style={s.loginLink}>
                            <Text style={s.loginLinkTxt}>¿Ya tienes cuenta? <Text style={s.loginLinkBold}>Inicia sesión</Text></Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <LocationPicker
                visible={locPickerVisible}
                onClose={() => setLocPickerVisible(false)}
                onSelect={setBusinessLoc}
            />

            <DatePickerModal
                visible={datePickerVisible}
                initialDate={personal.birthdate}
                onClose={() => setDatePickerVisible(false)}
                onSelect={setP('birthdate')}
            />
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.core.background },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 12,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: Colors.core.card,
        alignItems: 'center', justifyContent: 'center',
    },

    steps: { flexDirection: 'row', gap: 6 },
    stepDot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: Colors.core.border,
    },
    stepDotActive: { backgroundColor: Colors.core.tint, width: 20, borderRadius: 4 },
    stepDotDone: { backgroundColor: Colors.core.tint + '60' },

    scroll: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 160,
        maxWidth: 520, width: '100%', alignSelf: 'center',
    },

    title: { fontSize: 32, fontFamily: F.bold, color: Colors.core.text, letterSpacing: -1, marginBottom: 4 },
    subtitle: { fontSize: 15, fontFamily: F.regular, color: Colors.core.textSecondary, lineHeight: 24, marginBottom: 24 },

    fieldWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.core.card, borderRadius: 10, borderWidth: 1, borderColor: Colors.core.border, paddingHorizontal: 16, height: 56, marginBottom: 20 },
    input: { flex: 1, fontSize: 15, fontFamily: F.regular, color: Colors.core.text },

    roleCards: { gap: 16 },
    roleCard: {
        padding: 24, borderRadius: 16,
        backgroundColor: Colors.core.card,
        borderWidth: 1.5, borderColor: Colors.core.border,
        position: 'relative',
    },
    roleCardSel: { borderColor: Colors.core.tint, borderWidth: 2 },
    roleIcon: {
        width: 52, height: 52, borderRadius: 14,
        backgroundColor: Colors.core.border,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
    },
    roleIconSel: {},
    roleTitle: { fontSize: 18, fontFamily: F.bold, color: Colors.core.text, marginBottom: 6 },
    roleDesc: { fontSize: 13, fontFamily: F.regular, color: Colors.core.textSecondary, lineHeight: 18 },
    roleCheck: { position: 'absolute', top: 16, right: 16 },

    ownerBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginTop: 10,
        backgroundColor: Colors.core.border,
        alignSelf: 'flex-start',
        paddingHorizontal: 12, paddingVertical: 4,
        borderRadius: 20,
    },
    ownerBadgeTxt: { fontSize: 11, color: Colors.core.textSecondary, fontFamily: F.semibold },

    nameRow: { flexDirection: 'row', gap: 12 },

    verifyNote: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginBottom: 24,
    },
    verifyNoteTxt: {
        fontFamily: F.regular,
        fontSize: 12,
        color: Colors.core.textSecondary,
        flex: 1,
    },

    footer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: Colors.core.background,
        borderTopWidth: 1, borderTopColor: Colors.core.border,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        gap: 12,
    },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, justifyContent: 'space-between' },
    chip: {
        width: '48%',
        alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, paddingHorizontal: 8,
        borderRadius: 12, backgroundColor: Colors.core.card,
        borderWidth: 1, borderColor: 'transparent',
        minHeight: 74,
    },
    chipSel: { borderColor: Colors.core.tint, borderWidth: 1.5 },
    chipTxt: { fontFamily: F.medium, color: Colors.core.text, fontSize: 13, textAlign: 'center', lineHeight: 18 },

    ageBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: Colors.core.border, borderRadius: 5, paddingHorizontal: 4, paddingVertical: 1.5 },
    ageBadgeTxt: { fontFamily: F.bold, fontSize: 8, color: Colors.core.textSecondary, letterSpacing: 0.2 },

    customCatWrap: { marginTop: 20 },
    customCatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    customCatLabel: { fontSize: 13, fontFamily: F.semibold, color: Colors.core.text },
    customCatOpt: { fontSize: 12, fontFamily: F.medium, color: Colors.core.textSecondary },
    customCatInput: {
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.core.border,
        backgroundColor: Colors.core.card,
        color: Colors.core.text,
        paddingHorizontal: 16,
        fontFamily: F.regular,
        fontSize: 15,
    },
    nextBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: Colors.core.tint,
        height: 56, borderRadius: 10,
    },
    nextTxt: { color: '#fff', fontSize: 15, fontFamily: F.bold },

    loginLink: { alignItems: 'center', paddingBottom: 4 },
    loginLinkTxt: { fontFamily: F.regular, color: Colors.core.textSecondary, fontSize: 14 },
    loginLinkBold: { fontFamily: F.semibold, color: Colors.core.tint },
});
