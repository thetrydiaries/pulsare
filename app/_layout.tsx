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
    initStorage().then(() => setStorageReady(true));
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
  },
  rootWeb: {
    backgroundColor: Colors.background,
  },
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
