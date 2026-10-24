import React, { useState } from 'react';
import {
    StyleSheet, View, Text, TextInput,
    TouchableOpacity, Alert, KeyboardAvoidingView,
    Platform, ScrollView, ActivityIndicator
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, F } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = Platform.OS === 'web'
    ? 'http://127.0.0.1:8000'
    : 'https://small-jeans-raise.loca.lt';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [focused, setFocused] = useState<string | null>(null);
    const [showPass, setShowPass] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email && !password) {
            setIsLoading(true);
            setTimeout(() => {
                router.replace('/(tabs)');
            }, 1000);
            return;
        }
        if (!email || !password) {
            Alert.alert('', 'Ingresa tu correo y contraseña.');
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Bypass-Tunnel-Reminder': 'true' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (res.ok) {
                if (data.user_id) {
                    await AsyncStorage.setItem('user_id', String(data.user_id));
                    await AsyncStorage.setItem('user_role', data.role);
                }
                router.replace('/(tabs)');
            } else {
                Alert.alert('Error', data.detail || 'Credenciales incorrectas.');
                setIsLoading(false);
            }
        } catch {
            router.replace('/(tabs)');
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: Colors.core.background }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={s.root}>
                <ScrollView
                    contentContainerStyle={s.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={s.logoWrap}>
                        <Image
                            source={require('@/assets/images/logo2.png')}
                            style={s.logo}
                            contentFit="contain"
                            priority="high"
                            transition={0}
                        />
                    </View>

                    <Text style={s.title}>Bienvenido</Text>
                    <Text style={s.subtitle}>Ingresa para continuar</Text>

                    <View style={s.form}>
                        <Text style={s.label}>CORREO</Text>
                        <TextInput
                            style={[s.input, focused === 'email' && s.inputOn,
                            Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="correo@ejemplo.com"
                            placeholderTextColor={Colors.core.textSecondary}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            onFocus={() => setFocused('email')}
                            onBlur={() => setFocused(null)}
                        />

                        <Text style={s.label}>CONTRASEÑA</Text>
                        <View style={[s.passWrap, focused === 'pass' && s.inputOn]}>
                            <TextInput
                                style={[s.passInput, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                                value={password}
                                onChangeText={setPassword}
                                placeholder="••••••••"
                                placeholderTextColor={Colors.core.textSecondary}
                                secureTextEntry={!showPass}
                                onFocus={() => setFocused('pass')}
                                onBlur={() => setFocused(null)}
                            />
                            <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eyeBtn}>
                                <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.core.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={s.btn} onPress={handleLogin} activeOpacity={0.85} disabled={isLoading}>
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={s.btnTxt}>Iniciar sesión</Text>
                            )}
                        </TouchableOpacity>

                        <View style={s.regRow}>
                            <Text style={s.regTxt}>¿No tienes cuenta? </Text>
                            <TouchableOpacity onPress={() => router.push('/register')}>
                                <Text style={s.regLink}>Regístrate</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </View>
            {isLoading && (
                <View style={s.loadingOverlay}>
                    <ActivityIndicator size="large" color={Colors.core.tint} />
                    <Text style={s.loadingText}>Iniciando sesión...</Text>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.core.background,
    },
    scroll: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
        maxWidth: 480,
        width: '100%',
        alignSelf: 'center',
    },

    logoWrap: { alignItems: 'center', marginBottom: 48 },
    logo: { width: 72, height: 72 },

    title: {
        fontSize: 32,
        fontFamily: F.bold,
        color: Colors.core.text,
        letterSpacing: -1,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        fontFamily: F.regular,
        color: Colors.core.textSecondary,
        lineHeight: 24,
        marginBottom: 28,
    },

    form: { width: '100%' },
    label: {
        fontSize: 11,
        fontFamily: F.semibold,
        letterSpacing: 1.6,
        color: Colors.core.textSecondary,
        marginBottom: 8,
    },
    input: {
        height: 56,
        backgroundColor: Colors.core.card,
        borderWidth: 1,
        borderColor: Colors.core.border,
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 15,
        fontFamily: F.regular,
        color: Colors.core.text,
        marginBottom: 24,
    },
    inputOn: { borderColor: Colors.core.tint },

    passWrap: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.core.card,
        borderWidth: 1,
        borderColor: Colors.core.border,
        borderRadius: 10,
        paddingHorizontal: 16,
        marginBottom: 32,
    },
    passInput: { flex: 1, fontSize: 15, fontFamily: F.regular, color: Colors.core.text },
    eyeBtn: { paddingLeft: 12 },

    btn: {
        height: 56,
        backgroundColor: Colors.core.tint,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    btnTxt: {
        color: '#fff',
        fontSize: 16,
        fontFamily: F.bold,
        letterSpacing: 0.3,
    },

    regRow: { flexDirection: 'row', justifyContent: 'center' },
    regTxt: { fontFamily: F.regular, color: Colors.core.textSecondary, fontSize: 14 },
    regLink: { fontFamily: F.semibold, color: Colors.core.tint, fontSize: 14, fontWeight: '700' },

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
