import { View, Text, StyleSheet } from 'react-native';
import { Colors, F } from '@/constants/theme';

export default function BookingsScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Reservas - Próximamente</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1, backgroundColor: Colors.core.background,
        alignItems: 'center', justifyContent: 'center'
    },
    text: { color: Colors.core.text, fontFamily: F.medium, fontSize: 16 }
});
