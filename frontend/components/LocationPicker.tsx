import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, F } from '@/constants/theme';
import { DR_LOCATIONS, DRProvince, DRMunicipality, DRSector } from '@/constants/dominican_republic';

export type LocationSelection = {
    province: DRProvince | null;
    municipality: DRMunicipality | null;
    sector: DRSector | null;
};

export default function LocationPicker({
    visible,
    onClose,
    onSelect,
}: {
    visible: boolean;
    onClose: () => void;
    onSelect: (loc: LocationSelection) => void;
}) {
    const [step, setStep] = useState<'prov' | 'mun' | 'sec'>('prov');
    const [selProv, setSelProv] = useState<DRProvince | null>(null);
    const [selMun, setSelMun] = useState<DRMunicipality | null>(null);

    useEffect(() => {
        if (visible) {
            setStep('prov');
            setSelProv(null);
            setSelMun(null);
        }
    }, [visible]);

    const handleProv = (p: DRProvince) => {
        setSelProv(p);
        setStep('mun');
    };

    const handleMun = (m: DRMunicipality) => {
        setSelMun(m);
        onSelect({ province: selProv, municipality: m, sector: null });
        onClose();
    };

    const handleSec = (s: DRSector) => {
        onSelect({ province: selProv, municipality: selMun, sector: s });
        onClose();
    };

    const goBack = () => {
        if (step === 'sec') setStep('mun');
        else if (step === 'mun') setStep('prov');
        else onClose();
    };

    let title = 'Selecciona Provincia';
    let data: any[] = DR_LOCATIONS;
    let onRowPress: (item: any) => void = handleProv;

    if (step === 'mun' && selProv) {
        title = selProv.name;
        data = selProv.municipalities;
        onRowPress = handleMun;
    } else if (step === 'sec' && selMun) {
        title = selMun.name;
        data = selMun.sectors;
        onRowPress = handleSec;
    }

    return (
        <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
            <TouchableOpacity
                style={s.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity
                    style={s.sheet}
                    activeOpacity={1}
                    onPress={() => { }}
                >
                    <View style={s.handle} />

                    <View style={s.header}>
                        <TouchableOpacity style={s.backBtn} onPress={goBack}>
                            <Ionicons
                                name="chevron-back"
                                size={24}
                                color={Colors.core.text}
                            />
                        </TouchableOpacity>
                        <Text style={s.title}>{title}</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
                        {data.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={s.row}
                                onPress={() => onRowPress(item)}
                                activeOpacity={0.7}
                            >
                                <Text style={s.rowTxt}>{item.name}</Text>
                                <Ionicons name="chevron-forward" size={20} color={Colors.core.border} />
                            </TouchableOpacity>
                        ))}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.core.background,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        height: '80%',
        paddingTop: 12,
    },
    handle: {
        alignSelf: 'center',
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: Colors.core.border,
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    backBtn: {
        width: 40, height: 40,
        borderRadius: 20,
        backgroundColor: Colors.core.card,
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        fontFamily: F.bold,
        fontSize: 18,
        color: Colors.core.text,
    },
    list: {
        paddingHorizontal: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        borderBottomWidth: 1,
        borderBottomColor: Colors.core.border,
    },
    rowTxt: {
        fontFamily: F.medium,
        fontSize: 16,
        color: Colors.core.text,
    },
});
