import { Tabs } from 'expo-router';
import { Colors, F } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.core.background,
                    borderTopWidth: 1,
                    borderTopColor: Colors.core.border,
                    height: Platform.OS === 'ios' ? 88 : 70,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                    paddingTop: 12,
                },
                tabBarActiveTintColor: Colors.core.text,
                tabBarInactiveTintColor: Colors.core.textSecondary,
                tabBarShowLabel: false,
                tabBarLabelStyle: {
                    fontFamily: F.semibold,
                    fontSize: 11,
                    marginTop: 4,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />,
                }}
            />
            <Tabs.Screen
                name="bookings"
                options={{
                    title: 'Reservas',
                    tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "calendar" : "calendar-outline"} size={26} color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />,
                }}
            />
        </Tabs>
    );
}
