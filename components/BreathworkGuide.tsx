import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Animated,
  TouchableOpacity,
  AccessibilityInfo,
  PanResponder,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import Text from '@/components/ui/Text';
import { getPersonalisedCopy } from '@/lib/storage';

// ─── Technique definitions ─────────────────────────────────────────────────────

export type TechniqueKey = 'physiological-sigh' | 'cyclic-sigh' | 'box-breathing';

type PhaseLabel = 'inhale' | 'hold' | 'exhale';
type CircleTarget = 'min' | 'mid' | 'max';

interface BreathPhase {
  label: PhaseLabel;
  duration: number; // seconds
  target: CircleTarget;
  showTimer: boolean;
}

interface Technique {
  key: TechniqueKey;
  name: string;
  minDuration: number; // seconds
  phases: BreathPhase[];
  estimatedRounds: number;
}

const TECHNIQUES: Record<TechniqueKey, Technique> = {
  'physiological-sigh': {
    key: 'physiological-sigh',
    name: 'physiological sigh',
    minDuration: 120,
    estimatedRounds: 20,
    phases: [
      { label: 'inhale', duration: 2, target: 'mid', showTimer: false },
      { label: 'inhale', duration: 1, target: 'max', showTimer: false },
      { label: 'exhale', duration: 4, target: 'min', showTimer: false },
    ],
  },
  'cyclic-sigh': {
    key: 'cyclic-sigh',
    name: 'cyclic sighing',
    minDuration: 180,
    estimatedRounds: 15,
    phases: [
      { label: 'inhale', duration: 4, target: 'max', showTimer: true },
      { label: 'exhale', duration: 8, target: 'min', showTimer: true },
    ],
  },
  'box-breathing': {
    key: 'box-breathing',
    name: 'box breathing',
    minDuration: 240,
    estimatedRounds: 15,
    phases: [
      { label: 'inhale', duration: 4, target: 'max', showTimer: true },
      { label: 'hold', duration: 4, target: 'max', showTimer: true },
      { label: 'exhale', duration: 4, target: 'min', showTimer: true },
      { label: 'hold', duration: 4, target: 'min', showTimer: true },
    ],
  },
};

const CIRCLE_MIN = 120;
const CIRCLE_MID = 160;
const CIRCLE_MAX = 200;

function circleTargetToSize(target: CircleTarget): number {
  if (target === 'max') return CIRCLE_MAX;
  if (target === 'mid') return CIRCLE_MID;
  return CIRCLE_MIN;
}

const FALLBACK_INTROS: Record<TechniqueKey, string> = {
  'physiological-sigh': 'the fastest reset. two breaths is enough.',
  'cyclic-sigh': 'longer exhale. vagus nerve. three minutes.',
  'box-breathing': 'equal sides. prefrontal cortex on. four minutes.',
};

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  technique: TechniqueKey;
  onDismiss: () => void;
  onComplete?: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function BreathworkGuide({ visible, technique: techniqueKey, onDismiss, onComplete }: Props) {
  const technique = TECHNIQUES[techniqueKey];
  const phases = technique.phases;

  const [reduceMotion, setReduceMotion] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(phases[0].duration);
  const [round, setRound] = useState(1);
  const [showDone, setShowDone] = useState(false);

  // Refs to avoid stale closures in the interval
  const phaseIndexRef = useRef(0);
  const secondsLeftRef = useRef(phases[0].duration);
  const roundRef = useRef(1);
  const elapsedRef = useRef(0);
  const activeRef = useRef(false);

  const circleSizeAnim = useRef(new Animated.Value(CIRCLE_MIN)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Reset state when modal opens/closes or technique changes
  useEffect(() => {
    if (visible) {
      phaseIndexRef.current = 0;
      secondsLeftRef.current = phases[0].duration;
      roundRef.current = 1;
      elapsedRef.current = 0;
      activeRef.current = true;
      setPhaseIndex(0);
      setSecondsLeft(phases[0].duration);
      setRound(1);
      setShowDone(false);
      circleSizeAnim.setValue(CIRCLE_MIN);
      // Kick off first phase animation
      if (!reduceMotion) {
        animateToPhase(0);
      }
    } else {
      activeRef.current = false;
      circleSizeAnim.stopAnimation();
      circleSizeAnim.setValue(CIRCLE_MIN);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, techniqueKey]);

  function animateToPhase(index: number) {
    const phase = phases[index];
    const toSize = circleTargetToSize(phase.target);
    circleSizeAnim.stopAnimation();
    Animated.timing(circleSizeAnim, {
      toValue: toSize,
      duration: phase.duration * 1000,
      useNativeDriver: false,
    }).start();
  }

  // Ticker — 1s intervals
  useEffect(() => {
    if (!visible) return;
    const timer = setInterval(() => {
      if (!activeRef.current) return;

      secondsLeftRef.current -= 1;
      elapsedRef.current += 1;

      if (secondsLeftRef.current <= 0) {
        const nextIndex = (phaseIndexRef.current + 1) % phases.length;
        const isNewRound = nextIndex === 0;

        if (isNewRound) {
          roundRef.current += 1;
          setRound(roundRef.current);
        }

        phaseIndexRef.current = nextIndex;
        secondsLeftRef.current = phases[nextIndex].duration;

        setPhaseIndex(nextIndex);
        setSecondsLeft(phases[nextIndex].duration);

        if (!reduceMotion) {
          animateToPhase(nextIndex);
        }
      } else {
        setSecondsLeft(secondsLeftRef.current);
      }

      if (elapsedRef.current >= technique.minDuration) {
        setShowDone(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, techniqueKey, reduceMotion]);

  const onDismissRef = useRef(onDismiss);
  useEffect(() => { onDismissRef.current = onDismiss; }, [onDismiss]);

  const panResponder = useRef(
    PanResponder.create({
      // Claim touch on start; TouchableOpacity children still win via bubble-order priority
      onStartShouldSetPanResponder: () => true,
      // Don't let native gesture recognizers steal the touch once claimed
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 60) {
          onDismissRef.current();
        }
      },
    })
  ).current;

  function handleDone() {
    onComplete?.();
    onDismiss();
  }

  const copy = getPersonalisedCopy();
  const purposeLine =
    copy?.breathworkIntros?.[techniqueKey] ?? FALLBACK_INTROS[techniqueKey];

  const currentPhase = phases[phaseIndex];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onDismiss}
    >
      <View style={styles.screen} {...panResponder.panHandlers}>
        <SafeAreaView style={styles.safe}>
          <View style={styles.container}>
            {/* Top section */}
            <View style={styles.topSection}>
              <Text variant="serifItalic" size={28} style={styles.techniqueName}>
                {technique.name}
              </Text>
              <Text variant="label" color={Colors.textSecondary} style={styles.purposeLine}>
                {purposeLine}
              </Text>
            </View>

            {/* Circle section */}
            <View style={styles.circleSection}>
              {reduceMotion ? (
                <View style={[styles.circleStatic, { width: CIRCLE_MID, height: CIRCLE_MID, borderRadius: CIRCLE_MID / 2 }]} />
              ) : (
                <Animated.View
                  style={[
                    styles.circle,
                    {
                      width: circleSizeAnim,
                      height: circleSizeAnim,
                      borderRadius: Animated.divide(circleSizeAnim, 2) as unknown as number,
                    },
                  ]}
                />
              )}

              <Text variant="serifItalic" size={22} style={styles.phaseLabel}>
                {currentPhase.label}
              </Text>

              {currentPhase.showTimer && secondsLeft > 0 && (
                <Text variant="label" color={Colors.textTertiary} style={styles.phaseTimer}>
                  {secondsLeft}
                </Text>
              )}
            </View>

            {/* Bottom section */}
            <View style={styles.bottomSection}>
              <Text variant="label" color={Colors.textTertiary} style={styles.roundCounter}>
                round {round} of {technique.estimatedRounds}
              </Text>

              {showDone && (
                <TouchableOpacity
                  style={[styles.doneBtn, !onComplete && styles.doneBtnDismiss]}
                  onPress={handleDone}
                  accessibilityRole="button"
                  accessibilityLabel="done"
                >
                  <Text variant="body" color={Colors.tealText}>
                    done
                  </Text>
                </TouchableOpacity>
              )}

              {Platform.OS === 'web' ? (
                <TouchableOpacity
                  onPress={onDismiss}
                  style={styles.webCloseBtn}
                  accessibilityRole="button"
                  accessibilityLabel="close breathwork guide"
                >
                  <Text variant="label" color={Colors.textTertiary} style={styles.swipeHint}>
                    close
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text variant="label" color={Colors.textTertiary} style={styles.swipeHint}>
                  swipe down to close
                </Text>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  safe: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 32,
    paddingVertical: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 16,
  },
  techniqueName: {
    textAlign: 'center',
    lineHeight: 38,
  },
  purposeLine: {
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 14,
  },
  circleSection: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    minHeight: 260,
  },
  circle: {
    backgroundColor: `${Colors.tealAction}26`,
    borderWidth: 1.5,
    borderColor: `${Colors.tealText}99`,
  },
  circleStatic: {
    backgroundColor: `${Colors.tealAction}26`,
    borderWidth: 1.5,
    borderColor: `${Colors.tealText}99`,
  },
  phaseLabel: {
    letterSpacing: 0.5,
  },
  phaseTimer: {
    fontSize: 20,
    fontFamily: 'Outfit_300Light',
    marginTop: -12,
  },
  bottomSection: {
    alignItems: 'center',
    gap: 20,
    paddingBottom: 16,
  },
  roundCounter: {
    letterSpacing: 0.4,
    fontSize: 12,
  },
  doneBtn: {
    borderWidth: 1,
    borderColor: Colors.tealAction,
    borderRadius: 26,
    paddingVertical: 14,
    paddingHorizontal: 40,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneBtnDismiss: {},
  swipeHint: {
    fontSize: 11,
    opacity: 0.4,
  },
  webCloseBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
