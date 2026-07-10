import 'react-native-get-random-values';
import React, { useEffect, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
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
import { backfillDayPhase } from '@/lib/habits';
import { ensureCycleFields } from '@/lib/cycle';

if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync();
}

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
    initStorage().then(() => {
      // One-shot Huberman-migration backfills — idempotent, safe on every boot.
      backfillDayPhase();
      ensureCycleFields();
      setStorageReady(true);
    });
  }, []);

  useEffect(() => {
    if (storageReady && (fontsLoaded || fontError) && Platform.OS !== 'web') {
      SplashScreen.hideAsync();
    }
  }, [storageReady, fontsLoaded, fontError]);

  const isReady = storageReady && (fontsLoaded || !!fontError);

  return (
    <>
      <Head>
        <title>Pulsare</title>
        <meta name="theme-color" content="#0c0c0c" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Pulsare" />
        <link rel="apple-touch-icon" href="/pwa-icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
        <style>{`html, body { background-color: #0c0c0c; margin: 0; }`}</style>
      </Head>
      <View style={[styles.root, Platform.OS === 'web' ? styles.rootWeb : null]}>
        <View style={[styles.content, Platform.OS === 'web' ? styles.contentWeb : null]}>
          {isReady && (
            <>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="falloff" options={{ animation: 'fade' }} />
                <Stack.Screen name="unlock" options={{ animation: 'fade' }} />
                <Stack.Screen name="reflection" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
              </Stack>
            </>
          )}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  rootWeb: {},
  content: {
    flex: 1,
  },
  contentWeb: {
    maxWidth: 430,
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
});
