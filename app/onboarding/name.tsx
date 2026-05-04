import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage } from '@/lib/storage';

export default function NameScreen() {
  const [name, setName] = useState('');

  function handleNext() {
    const trimmed = name.trim();
    if (!trimmed) return;
    storage.set('onboarding.name', trimmed);
    router.push('/onboarding/mood');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          <PipIndicator total={12} current={1} />

          <View style={styles.content}>
            <Text variant="serif" size={28} style={styles.question}>
              What do you want me to call you?
            </Text>

            <TextInput
              style={styles.input}
              placeholder="your name"
              placeholderTextColor={Colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleNext}
              maxLength={30}
              accessibilityLabel="enter your name"
            />
          </View>

          <Button
            label="next"
            onPress={handleNext}
            disabled={!name.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  kav: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 32,
  },
  question: {
    lineHeight: 38,
  },
  input: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 22,
    color: Colors.textPrimary,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
});
