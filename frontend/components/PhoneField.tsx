import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, F } from '@/constants/theme';

export type PhoneFieldProps = {
    label: string;
    value: string;
    onChange: (val: string) => void;
};

const AREA_CODES = ['809', '829', '849'];

export default function PhoneField({ label, value, onChange }: PhoneFieldProps) {
    const [open, setOpen] = useState(false);
    const [areaCode, setAreaCode] = useState('809');
    const [number, setNumber] = useState('');

    useEffect(() => {
        if (!value) return;
        const digits = value.replace(/\D/g, '');
        let core = digits.startsWith('1') ? digits.substring(1) : digits;
        if (core.length >= 3) {
            const ext = core.substring(0, 3);
            if (AREA_CODES.includes(ext)) {
                setAreaCode(ext);
                setNumber(core.substring(3));
                return;
            }
        }
        setNumber(core);
    }, [value]);

    const handleNumberChange = (text: string) => {
        const clean = text.replace(/\D/g, '').slice(0, 7);
        setNumber(clean);
        onChange(`+1 ${areaCode} ${clean}`);
    };

    const handleSelectArea = (code: string) => {
        setAreaCode(code);
        setOpen(false);
        const clean = number.replace(/\D/g, '');
        onChange(`+1 ${code} ${clean}`);
    };

    let display = number.replace(/\D/g, '');
    if (display.length > 3) display = `${display.substring(0, 3)}-${display.substring(3)}`;

    return (
        <View style={[s.container, open && { zIndex: 10 }]}>
            <Text style={s.label}>{label}</Text>

            <View style={[s.inputWrap, open && { zIndex: 10 }]}>
                {open && (
                    <TouchableOpacity
                        style={[s.backdrop, Platform.OS === 'web' && { position: 'fixed', width: '100vw', height: '100vh', top: 0, left: 0 } as any]}
                        activeOpacity={1}
                        onPress={() => setOpen(false)}
                    />
                )}

                <View style={[s.inputRow, open && s.inputRowOpen]}>
                    <TouchableOpacity
                        style={s.areaSelector}
                        onPress={() => setOpen(o => !o)}
                        activeOpacity={0.8}
                    >
                        <Text style={s.areaTxt}>+1 ({areaCode})</Text>
                        <Ionicons
                            name={open ? 'chevron-up' : 'chevron-down'}
                            size={14}
                            color={Colors.core.textSecondary}
                        />
                    </TouchableOpacity>

                    <View style={s.divider} />

                    <TextInput
                        style={[s.input, Platform.OS === 'web' && { outlineStyle: 'none' } as any]}
                        value={display}
                        onChangeText={handleNumberChange}
                        keyboardType="numeric"
                        placeholder="000-0000"
                        placeholderTextColor={Colors.core.textSecondary}
                        maxLength={8}
                        onFocus={() => setOpen(false)}
                    />
                </View>

                {open && (
                    <View style={s.dropdown}>
                        {AREA_CODES.map((code, idx) => {
                            const sel = areaCode === code;
                            const isLast = idx === AREA_CODES.length - 1;
                            return (
                                <TouchableOpacity
                                    key={code}
                                    style={[s.option, !isLast && s.optionBorder, sel && s.optionSel]}
                                    onPress={() => handleSelectArea(code)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={s.flag}>🇩🇴</Text>
                                    <Text style={s.optTxt}>{`+1 (${code})`}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
            </View>
        </View>
    );
}

const s = StyleSheet.create({
    container: { marginBottom: 20 },
    label: {
        fontSize: 11,
        fontFamily: F.semibold,
        letterSpacing: 1.6,
        color: Colors.core.textSecondary,
        marginBottom: 8,
    },
    inputWrap: {
        position: 'relative',
    },
    inputRow: {
        flexDirection: 'row',
        height: 56,
        backgroundColor: Colors.core.card,
        borderWidth: 1,
        borderColor: Colors.core.border,
        borderRadius: 10,
        alignItems: 'center',
    },
    inputRowOpen: {
        borderColor: Colors.core.tint,
    },
    areaSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        width: 140,
        height: '100%',
    },
    areaTxt: {
        fontSize: 15,
        fontFamily: F.medium,
        color: Colors.core.text,
    },
    divider: {
        width: 1,
        height: 28,
        backgroundColor: Colors.core.border,
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontFamily: F.regular,
        color: Colors.core.text,
        paddingHorizontal: 16,
    },
    backdrop: {
        position: 'absolute',
        top: -2000,
        bottom: -2000,
        left: -2000,
        right: -2000,
        zIndex: 90,
    },
    dropdown: {
        position: 'absolute',
        top: 62,
        left: 0,
        width: 140,
        backgroundColor: Colors.core.card,
        borderWidth: 1,
        borderColor: Colors.core.border,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
        zIndex: 100,
        overflow: 'hidden',
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: Colors.core.card,
    },
    optionSel: {
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
    },
    optionBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.core.border,
    },
    flag: { fontSize: 16, marginRight: 8 },
    optTxt: {
        flex: 1,
        fontSize: 14,
        fontFamily: F.medium,
        color: Colors.core.text,
        lineHeight: 18,
    },
    optTxtSel: {},
});
