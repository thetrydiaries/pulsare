import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import Button from '@/components/ui/Button';
import PipIndicator from '@/components/ui/PipIndicator';
import { storage, setOnboardingLastScreen } from '@/lib/storage';

function StackCard({ trigger, action }: { trigger: string; action: string }) {
  return (
    <View style={styles.card}>
      <Text variant="label" color={Colors.textTertiary} style={styles.triggerLabel}>
        when
      </Text>
      <Text variant="body" style={styles.triggerText}>{trigger}</Text>
      <View style={styles.arrow}>
        <View style={styles.arrowLine} />
        <Text variant="label" color={Colors.tealText} style={styles.arrowText}>then</Text>
        <View style={styles.arrowLine} />
      </View>
      <Text variant="bodySemibold" color={Colors.tealText} style={styles.actionText}>
        {action}
      </Text>
    </View>
  );
}

export default function IntentionsScreen() {
  const movement = storage.getString('onboarding.movement') ?? 'morning movement';
  const eveningLabel = storage.getString('onboarding.eveningHabitLabel') ?? 'my evening habit';
  const windDown = storage.getString('onboarding.notif.windDown') ?? '21:30';

  function formatTime(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    const ampm = h >= 12 ? 'pm' : 'am';
    const dh = h % 12 === 0 ? 12 : h % 12;
    return `${dh}:${m.toString().padStart(2, '0')}${ampm}`;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <PipIndicator total={13} current={12} />

        <View style={styles.content}>
          <Text variant="serif" size={26} style={styles.headline}>
            one more thing.
          </Text>
          <Text variant="body" color={Colors.textSecondary} style={styles.sub}>
            if-then plans increase follow-through by up to 3x. read these once — your brain will do the rest.
          </Text>

          <View style={styles.cards}>
            <StackCard
              trigger="my alarm goes off"
              action="step outside or near a bright window for morning light"
            />
            <StackCard
              trigger="morning light is done"
              action="drink water before coffee"
            />
            <StackCard
              trigger="water is done"
              action={movement}
            />
            <StackCard
              trigger={`it's ${formatTime(windDown)}`}
              action={eveningLabel}
            />
          </View>

          <Text variant="label" color={Colors.textTertiary} style={styles.footnote}>
            these aren't rules. they're anchors. the sequence is the science.
          </Text>
        </View>

        <Button label="got it" onPress={() => { setOnboardingLastScreen(12); router.push('/onboarding/handoff'); }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 32 },
  content: { flex: 1, gap: 24, paddingVertical: 24 },
  headline: { lineHeight: 36 },
  sub: { lineHeight: 24, marginTop: -8 },
  cards: { gap: 10 },
  card: {
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 6,
  },
  triggerLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  triggerText: {
    fontSize: 15,
    lineHeight: 22,
  },
  arrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 2,
  },
  arrowLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: Colors.border,
  },
  arrowText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  actionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  footnote: {
    lineHeight: 20,
    textAlign: 'center',
    marginTop: -8,
  },
});
