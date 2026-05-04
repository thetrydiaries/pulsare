import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';

export default function ScienceScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <PipIndicator total={12} current={3} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="serif" size={22} style={styles.body}>
            Pulsare works by rebuilding your nervous system from the ground up — starting with the things that regulate everything else: when you wake, how you move, and how you breathe.
          </Text>

          <Text variant="body" color={Colors.textSecondary} style={styles.body}>
            Like a pulsar, the most stable signal in the known universe, it's consistency that does the work. We add slowly. We never punish a missed day. Small, regular signals to your body are more powerful than big efforts followed by crashes.
          </Text>
        </ScrollView>

        <Button
          label="that makes sense"
          onPress={() => router.push('/onboarding/wake-time')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 32,
  },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 32,
  },
  body: {
    lineHeight: 30,
  },
});
