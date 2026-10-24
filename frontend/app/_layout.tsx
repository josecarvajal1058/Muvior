import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import 'react-native-reanimated';

import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [animationFinished, setAnimationFinished] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const progressAnimation = useRef(new Animated.Value(0)).current;

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    SplashScreen.hideAsync().catch(console.warn);
  }, []);

  useEffect(() => {
    if (logoLoaded && fontsLoaded) {
      Animated.timing(progressAnimation, {
        toValue: 100,
        duration: 1000,
        useNativeDriver: false,
      }).start(() => setAnimationFinished(true));
    }
  }, [logoLoaded, fontsLoaded]);

  if (!animationFinished) {
    const progressWidth = progressAnimation.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.container}>
        <View style={styles.logoWrapper}>
          <Image
            source={require('@/assets/images/logo2.png')}
            style={styles.logo}
            contentFit="contain"
            priority="high"
            transition={0}
            onLoad={() => setLogoLoaded(true)}
          />
        </View>
        <View style={[styles.progressBarBackground, { opacity: logoLoaded ? 1 : 0 }]}>
          <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
        </View>
        <StatusBar style="light" backgroundColor={Colors.core.background} />
      </View>
    );
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{
        contentStyle: { backgroundColor: Colors.core.background },
        animation: 'slide_from_right',
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="business/[id]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" backgroundColor={Colors.core.background} />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.core.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: { marginBottom: 40 },
  logo: { width: 110, height: 110 },
  progressBarBackground: {
    width: 120,
    height: 3,
    backgroundColor: Colors.core.card,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.core.tint,
    borderRadius: 2,
  },
});
