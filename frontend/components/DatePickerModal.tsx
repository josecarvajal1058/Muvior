import React, { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Modal, Platform, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Colors, F } from '@/constants/theme';

const ITEM_H = 56;
const VISIBLE = 5;

const currYear = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => String(currYear - i));
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

type DrumColProps = {
    values: string[];
    selected: number;
    onChange: (i: number) => void;
};
type DrumHandle = { getIdx: () => number };

const DrumColumn = forwardRef<DrumHandle, DrumColProps>(function DrumColumn({ values, selected, onChange }, fwdRef) {
    const scrollRef = useRef<ScrollView>(null);
    const liveRef = useRef(selected);
    const [visualIdx, setVisualIdx] = useState(selected);

    useImperativeHandle(fwdRef, () => ({ getIdx: () => liveRef.current }), []);

    useEffect(() => {
        setTimeout(() => {
            scrollRef.current?.scrollTo({ y: selected * ITEM_H, animated: false });
        }, 10);
        liveRef.current = selected;
        setVisualIdx(selected);
    }, [selected]);

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
                snapToAlignment="start"
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
                            key={`${v}-${i}`}
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
    txt: { fontSize: 26, fontFamily: F.bold, color: Colors.core.textSecondary, letterSpacing: 1 },
    txtSel: { color: Colors.core.text },
});

export type DatePickerModalProps = {
    visible: boolean;
    initialDate?: string;
    onClose: () => void;
    onSelect: (date: string) => void;
};

export default function DatePickerModal({ visible, initialDate, onClose, onSelect }: DatePickerModalProps) {
    const defaultY = 25;
    const defaultM = 0;
    const defaultD = 0;

    const [editY, setEditY] = useState(defaultY);
    const [editM, setEditM] = useState(defaultM);
    const [editD, setEditD] = useState(defaultD);

    const drumYRef = useRef<DrumHandle>(null);
    const drumMRef = useRef<DrumHandle>(null);
    const drumDRef = useRef<DrumHandle>(null);

    useEffect(() => {
        if (visible) {
            if (initialDate && initialDate.length >= 8) {
                const parts = initialDate.split('-');
                if (parts.length === 3) {
                    const y = YEARS.indexOf(parts[0]);
                    const m = MONTHS.indexOf(parts[1]);
                    const d = DAYS.indexOf(parts[2]);
                    setEditY(y >= 0 ? y : defaultY);
                    setEditM(m >= 0 ? m : defaultM);
                    setEditD(d >= 0 ? d : defaultD);
                    return;
                }
            }
            setEditY(defaultY);
            setEditM(defaultM);
            setEditD(defaultD);
        }
    }, [visible, initialDate]);

    const handleAccept = () => {
        const idxY = drumYRef.current?.getIdx() ?? editY;
        const idxM = drumMRef.current?.getIdx() ?? editM;
        const idxD = drumDRef.current?.getIdx() ?? editD;

        const y = YEARS[idxY];
        const m = MONTHS[idxM];
        let d = DAYS[idxD];

        const dNum = parseInt(d);
        const mNum = parseInt(m);
        const maxDays = new Date(parseInt(y), mNum, 0).getDate();
        if (dNum > maxDays) {
            d = String(maxDays).padStart(2, '0');
        }

        onSelect(`${y}-${m}-${d}`);
        onClose();
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />
            <View style={s.sheet}>
                <View style={s.handle} />
                <View style={s.sheetHead}>
                    <View>
                        <Text style={s.sheetTitle}>Fecha de nacimiento</Text>
                        <Text style={s.sheetSub}>Día, mes y año.</Text>
                    </View>
                </View>

                <View style={s.modeContainer}>
                    <View style={s.drumRow}>
                        <DrumColumn ref={drumDRef} values={DAYS} selected={editD} onChange={setEditD} />
                        <View style={{ width: 10 }} />
                        <DrumColumn ref={drumMRef} values={MONTHS} selected={editM} onChange={setEditM} />
                        <View style={{ width: 10 }} />
                        <DrumColumn ref={drumYRef} values={YEARS} selected={editY} onChange={setEditY} />
                    </View>
                </View>

                <View style={s.actionRow}>
                    <TouchableOpacity style={s.btnSec} onPress={onClose}>
                        <Text style={s.btnSecTxt}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={s.btnPri} onPress={handleAccept}>
                        <Text style={s.btnPriTxt}>Guardar fecha</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
    sheet: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: Colors.core.card,
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        paddingHorizontal: 24, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 44 : 28
    },
    handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 2.5, backgroundColor: Colors.core.border, marginBottom: 28 },
    sheetHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
    sheetTitle: { fontFamily: F.bold, fontSize: 22, color: Colors.core.text, letterSpacing: -0.5 },
    sheetSub: { fontFamily: F.regular, fontSize: 14, color: Colors.core.textSecondary, marginTop: 4 },
    modeContainer: { minHeight: ITEM_H * VISIBLE, marginBottom: 24 },
    drumRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
    btnSec: { flex: 1, paddingVertical: 18, borderRadius: 12, alignItems: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.core.border },
    btnSecTxt: { fontFamily: F.semibold, color: Colors.core.text, fontSize: 16 },
    btnPri: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 18, borderRadius: 12, backgroundColor: Colors.core.tint },
    btnPriTxt: { fontFamily: F.bold, color: '#fff', fontSize: 16 },
});
