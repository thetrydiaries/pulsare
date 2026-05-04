import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_400Regular_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
} from '@expo-google-fonts/outfit';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '@/constants/colors';
import { initStorage } from '@/lib/storage';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [storageReady, setStorageReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
  });

  useEffect(() => {
    initStorage().then(() => setStorageReady(true));
  }, []);

  useEffect(() => {
    if (storageReady && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [storageReady, fontsLoaded, fontError]);

  if (!storageReady || (!fontsLoaded && !fontError)) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="falloff" options={{ animation: 'fade' }} />
        <Stack.Screen name="reflection" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      </Stack>
    </>
  );
}
