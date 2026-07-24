import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { sendUnlock } from '@/ble/lockbox';
import { BackPill, PrimaryButton } from '@/components/ui';
import { HOMES, VENDOR } from '@/data/demo';
import { colors, radii } from '@/theme';

const DIAL = 178;
const STROKE = 13;
const R = (DIAL - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

function Padlock({ unlocked }: { unlocked: boolean }) {
  const shackleY = useRef(new Animated.Value(0)).current;
  const led = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(shackleY, {
      toValue: unlocked ? -16 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [unlocked, shackleY]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(led, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(led, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [led]);

  const ledColor = unlocked ? colors.ledGreen : 'rgba(255,255,255,0.5)';

  return (
    <View style={styles.padlock}>
      <Animated.View style={[styles.shackle, { transform: [{ translateY: shackleY }] }]} />
      <View style={styles.lockBody}>
        <View style={styles.ledRow}>
          <Animated.View
            style={[
              styles.led,
              { backgroundColor: ledColor, shadowColor: ledColor, opacity: led },
            ]}
          />
          <Text style={styles.ledLabel}>OPENACCESS</Text>
        </View>
        <View style={styles.keyLid}>
          <View style={styles.keyLidSlot} />
        </View>
      </View>
    </View>
  );
}

export default function UnlockScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ home?: string }>();
  const home = HOMES[Number(params.home)] ?? HOMES[0];

  const [progress, setProgress] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [unlockTime, setUnlockTime] = useState('');
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => clearInterval(holdTimer.current ?? undefined), []);

  const startHold = () => {
    if (unlocked) return;
    clearInterval(holdTimer.current ?? undefined);
    holdTimer.current = setInterval(() => {
      setProgress((p) => {
        const next = p + 2.6;
        if (next >= 100) {
          clearInterval(holdTimer.current ?? undefined);
          setUnlocked(true);
          setUnlockTime(
            new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          );
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Tell the board to release the lid; demo continues even if the
          // write fails (e.g. board unplugged after the finder step).
          sendUnlock();
          return 100;
        }
        return next;
      });
    }, 30);
  };

  const endHold = () => {
    clearInterval(holdTimer.current ?? undefined);
    if (!unlocked) setProgress(0);
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <BackPill label="Finder" dark onPress={() => router.back()} />
        <Text style={styles.topTitle}>LB-{home.boxId}</Text>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.padlockWrap}>
        <Padlock unlocked={unlocked} />
      </View>

      {!unlocked ? (
        <>
          <View style={styles.copy}>
            <Text style={styles.title}>Hold to unlock</Text>
            <Text style={styles.body}>
              Keep the button pressed — the lockbox confirms over Bluetooth and
              releases the key lid.
            </Text>
          </View>

          <View style={styles.dialWrap}>
            <Pressable onPressIn={startHold} onPressOut={endHold} style={styles.dial}>
              <Svg width={DIAL} height={DIAL} style={StyleSheet.absoluteFill}>
                <Circle
                  cx={DIAL / 2}
                  cy={DIAL / 2}
                  r={R}
                  stroke="rgba(255,255,255,0.16)"
                  strokeWidth={STROKE}
                  fill="none"
                />
                <Circle
                  cx={DIAL / 2}
                  cy={DIAL / 2}
                  r={R}
                  stroke="#FFFFFF"
                  strokeWidth={STROKE}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE * (1 - progress / 100)}
                  transform={`rotate(-90 ${DIAL / 2} ${DIAL / 2})`}
                />
              </Svg>
              <View style={styles.dialInner}>
                <Text style={styles.dialWord}>{progress > 0 ? 'Unlocking…' : 'Hold'}</Text>
                <Text style={styles.dialSub}>
                  {progress > 0 ? `${Math.round(progress)}%` : 'ready'}
                </Text>
              </View>
            </Pressable>
          </View>

          <Text style={styles.footnote}>Haptic double-tap confirms release</Text>
        </>
      ) : (
        <>
          <View style={styles.successBlock}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <Text style={styles.title}>Lid released</Text>
            <Text style={[styles.body, { paddingHorizontal: 0 }]}>
              Grab the key and close the lid firmly when you're done. It re-locks
              automatically.
            </Text>
            <View style={styles.logCard}>
              <View style={styles.logRow}>
                <Text style={styles.logLabel}>Access logged</Text>
                <Text style={styles.logValue}>{unlockTime}</Text>
              </View>
              <View style={styles.logRow}>
                <Text style={styles.logLabel}>Lockbox</Text>
                <Text style={styles.logValue}>LB-{home.boxId}</Text>
              </View>
              <View style={styles.logRow}>
                <Text style={styles.logLabel}>Visitor</Text>
                <Text style={styles.logValue}>
                  {VENDOR.shortName} · {VENDOR.role}
                </Text>
              </View>
            </View>
          </View>
          <PrimaryButton
            label="Done"
            variant="white"
            style={{ marginHorizontal: 20, marginTop: 'auto', marginBottom: 12 }}
            onPress={() => router.dismissAll()}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navy },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13.5,
    fontWeight: '500',
    color: colors.whiteMuted,
    fontVariant: ['tabular-nums'],
  },
  padlockWrap: { alignItems: 'center', paddingTop: 26, paddingBottom: 6 },
  padlock: { width: 108, height: 148 },
  shackle: {
    position: 'absolute',
    left: 19,
    top: 0,
    width: 70,
    height: 58,
    borderWidth: 10,
    borderBottomWidth: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderColor: '#C9CDD6',
  },
  lockBody: {
    position: 'absolute',
    left: 0,
    top: 40,
    width: 108,
    height: 108,
    borderRadius: 18,
    backgroundColor: '#242A36',
    borderTopColor: 'rgba(255,255,255,0.22)',
    borderTopWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 14 },
  },
  ledRow: {
    position: 'absolute',
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  led: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  ledLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.3,
    fontWeight: '700',
  },
  keyLid: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#20252F',
    borderTopColor: 'rgba(255,255,255,0.1)',
    borderTopWidth: 1,
  },
  keyLidSlot: {
    position: 'absolute',
    left: '50%',
    top: 6,
    width: 26,
    height: 3.5,
    marginLeft: -13,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  copy: { alignItems: 'center', paddingTop: 8, paddingHorizontal: 40 },
  title: { fontSize: 21, fontWeight: '500', letterSpacing: -0.21, color: '#FFFFFF' },
  body: {
    fontSize: 13.5,
    color: colors.whiteMuted,
    marginTop: 6,
    lineHeight: 20,
    textAlign: 'center',
  },
  dialWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dial: { width: DIAL, height: DIAL, alignItems: 'center', justifyContent: 'center' },
  dialInner: {
    width: DIAL - 26,
    height: DIAL - 26,
    borderRadius: (DIAL - 26) / 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dialWord: { fontSize: 16, fontWeight: '700', color: colors.navy },
  dialSub: {
    fontSize: 12.5,
    color: 'rgba(5,26,68,0.55)',
    fontVariant: ['tabular-nums'],
  },
  footnote: {
    textAlign: 'center',
    paddingBottom: 16,
    fontSize: 12,
    color: colors.whiteFaint,
  },
  successBlock: { alignItems: 'center', gap: 9, paddingTop: 12, paddingHorizontal: 32 },
  checkCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.greenTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontSize: 26, color: colors.green },
  logCard: {
    marginTop: 12,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 9,
  },
  logRow: { flexDirection: 'row', justifyContent: 'space-between' },
  logLabel: { fontSize: 13, color: 'rgba(255,255,255,0.55)' },
  logValue: { fontSize: 13, color: '#FFFFFF', fontVariant: ['tabular-nums'] },
});
