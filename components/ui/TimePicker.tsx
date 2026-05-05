import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/constants/colors';
import Text from './Text';

interface Props {
  value: string; // HH:MM
  label?: string;
  onChange: (value: string) => void;
}

function formatDisplay(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m.toString().padStart(2, '0')}${ampm}`;
}

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

export default function TimePicker({ value, label, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(() => parseInt(value.split(':')[0], 10));
  const [m, setM] = useState(() => parseInt(value.split(':')[1], 10));

  function confirm() {
    onChange(`${pad(h)}:${pad(m)}`);
    setOpen(false);
  }

  function adjustH(delta: number) {
    setH((prev) => (prev + delta + 24) % 24);
  }

  function adjustM(delta: number) {
    setM((prev) => (prev + delta + 60) % 60);
  }

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? 'time'}: ${formatDisplay(value)}, tap to change`}
      >
        {label && (
          <Text variant="label" style={styles.label}>
            {label}
          </Text>
        )}
        <Text variant="bodySemibold" color={Colors.tealText} size={18}>
          {formatDisplay(value)}
        </Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.backdrop} onPress={() => setOpen(false)} activeOpacity={1}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
            <Text variant="label" style={{ marginBottom: 24, textAlign: 'center' }}>
              {label ?? 'select time'}
            </Text>

            <View style={styles.spinners}>
              {/* Hour */}
              <View style={styles.column}>
                <TouchableOpacity style={styles.arrow} onPress={() => adjustH(1)} accessibilityLabel="increase hour">
                  <Text variant="body" color={Colors.tealText}>▲</Text>
                </TouchableOpacity>
                <Text variant="serif" size={32} style={styles.digit}>
                  {pad(h % 12 === 0 ? 12 : h % 12)}
                </Text>
                <TouchableOpacity style={styles.arrow} onPress={() => adjustH(-1)} accessibilityLabel="decrease hour">
                  <Text variant="body" color={Colors.tealText}>▼</Text>
                </TouchableOpacity>
              </View>

              <Text variant="serif" size={28} style={styles.colon}>:</Text>

              {/* Minute */}
              <View style={styles.column}>
                <TouchableOpacity style={styles.arrow} onPress={() => adjustM(5)} accessibilityLabel="increase minute">
                  <Text variant="body" color={Colors.tealText}>▲</Text>
                </TouchableOpacity>
                <Text variant="serif" size={32} style={styles.digit}>
                  {pad(m)}
                </Text>
                <TouchableOpacity style={styles.arrow} onPress={() => adjustM(-5)} accessibilityLabel="decrease minute">
                  <Text variant="body" color={Colors.tealText}>▼</Text>
                </TouchableOpacity>
              </View>

              {/* AM/PM */}
              <TouchableOpacity
                style={styles.ampm}
                onPress={() => setH((prev) => (prev + 12) % 24)}
                accessibilityLabel={h >= 12 ? 'pm, tap for am' : 'am, tap for pm'}
              >
                <Text variant="bodySemibold" color={Colors.tealText}>
                  {h >= 12 ? 'pm' : 'am'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.confirm} onPress={confirm} accessibilityRole="button" accessibilityLabel="confirm time">
              <Text variant="bodySemibold" color={Colors.background}>done</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 44,
    justifyContent: 'center',
  },
  label: {
    marginBottom: 2,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 32,
    paddingBottom: 48,
    borderTopWidth: 0.5,
    borderColor: Colors.border,
  },
  spinners: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 8,
  },
  column: {
    alignItems: 'center',
    gap: 8,
  },
  arrow: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    minWidth: 60,
    textAlign: 'center',
  },
  colon: {
    marginTop: -4,
    color: Colors.textSecondary,
  },
  ampm: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  confirm: {
    backgroundColor: Colors.tealText,
    borderRadius: 26,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
