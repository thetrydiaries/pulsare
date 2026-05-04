import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.pip}>
          <PipIndicator total={12} current={0} />
        </View>

        <View style={styles.content}>
          <Text variant="serif" size={34} style={styles.headline}>
            you're here.
          </Text>
          <Text variant="serifItalic" size={34} style={styles.sub}>
            that's already something.
          </Text>
        </View>

        <Button
          label="let's begin"
          onPress={() => router.push('/onboarding/name')}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
  },
  pip: {
    paddingTop: 20,
    paddingBottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  headline: {
    lineHeight: 44,
  },
  sub: {
    lineHeight: 44,
    color: Colors.textSecondary,
  },
  button: {
    marginTop: 16,
  },
});
