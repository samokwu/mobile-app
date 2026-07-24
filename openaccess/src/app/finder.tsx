import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLockboxScanner } from '@/ble/useLockboxScanner';
import { BackPill, PrimaryButton } from '@/components/ui';
import { HOMES, IN_RANGE_THRESHOLD_M } from '@/data/demo';
import { colors, radii } from '@/theme';

const RADAR_SIZE = 272;
const CENTER = RADAR_SIZE / 2;
const MAX_RANGE_M = 30;

// Expanding ring that fades out, like the design's oaPulse keyframes.
function PulseRing({ durationMs, phaseOffsetMs = 0 }: { durationMs: number; phaseOffsetMs?: number }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    const timer = setTimeout(() => {
      loop = Animated.loop(
        Animated.timing(progress, {
          toValue: 1,
          duration: durationMs,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      );
      loop.start();
    }, phaseOffsetMs);
    return () => {
      clearTimeout(timer);
      loop?.stop();
      progress.setValue(0);
    };
  }, [durationMs, phaseOffsetMs, progress]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulseRing,
        {
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] }),
          transform: [
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1.08] }) },
          ],
        },
      ]}
    />
  );
}

// Small bar that oscillates in height, for the haptic cadence indicator.
function WaveBar({ durationMs, delayMs }: { durationMs: number; delayMs: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(v, { toValue: 1, duration: durationMs / 2, useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: durationMs / 2, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [durationMs, delayMs, v]);
  return (
    <Animated.View
      style={[
        styles.waveBar,
        { transform: [{ scaleY: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }] },
      ]}
    />
  );
}

export default function FinderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ home?: string }>();
  const home = HOMES[Number(params.home)] ?? HOMES[0];

  const { status, rssi, distanceM } = useLockboxScanner();
  const found = status === 'found' && distanceM != null;
  const d = found ? distanceM : MAX_RANGE_M;

  const pct = Math.max(0, Math.min(1, 1 - d / MAX_RANGE_M));
  const inRange = found && d <= IN_RANGE_THRESHOLD_M;
  // Ring pulses speed up as you close in (2.4 s far away, ~0.55 s on top of it).
  const ringDurMs = Math.round((2.4 - 1.85 * pct) * 100) * 10;

  // The blip drifts around its bearing a little, like the design demo. BLE
  // gives distance only (no direction), so the angle is decorative.
  const [bearing, setBearing] = useState(38);
  useEffect(() => {
    const t = setInterval(() => {
      setBearing((b) => {
        const jitter = (Math.random() - 0.5) * (1.2 + d * 0.5);
        return b * 0.9 + (30 + d * 0.6 + jitter) * 0.1;
      });
    }, 320);
    return () => clearInterval(t);
  }, [d]);

  const blipPos = useRef(new Animated.ValueXY({ x: CENTER, y: CENTER })).current;
  useEffect(() => {
    const r = 12 + (Math.min(d, MAX_RANGE_M) / MAX_RANGE_M) * 112;
    const rad = ((bearing - 90) * Math.PI) / 180;
    Animated.timing(blipPos, {
      toValue: { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) },
      duration: 340,
      useNativeDriver: false,
    }).start();
  }, [bearing, d, blipPos]);

  // Haptic pulse at the same cadence as the radar rings while the board is
  // in sight — taps get stronger and faster as you approach.
  useEffect(() => {
    if (!found) return;
    const t = setInterval(() => {
      Haptics.impactAsync(
        inRange ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
      );
    }, ringDurMs);
    return () => clearInterval(t);
  }, [found, inRange, ringDurMs]);

  const distLabel = !found ? '—' : d < 10 ? d.toFixed(1) : String(Math.round(d));
  const statusText =
    status === 'unavailable'
      ? 'Bluetooth needs the dev build — run npx expo run:ios'
      : status === 'off'
        ? 'Turn on Bluetooth to find the lockbox'
        : !found
        ? 'Searching for lockbox…'
        : inRange
          ? 'In range — ready to unlock'
          : d < 6
            ? 'Very close — check left of the door'
            : d < 14
              ? 'Getting closer'
              : 'Walk toward the front of the house';

  const sigOn = found ? Math.max(1, Math.round(pct * 5)) : 0;
  const sigBars = useMemo(
    () =>
      [0, 1, 2, 3, 4].map((i) => ({
        h: 5 + i * 3.8,
        on: i < sigOn,
      })),
    [sigOn],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.topBar}>
        <BackPill label="Back" dark onPress={() => router.back()} />
        <Text style={styles.topTitle} numberOfLines={1}>
          {home.addr}
        </Text>
        {/* spacer balancing the back pill so the title centers */}
        <View style={{ width: 62 }} />
      </View>

      <View style={styles.radarWrap}>
        <View style={styles.radar}>
          <View style={[styles.staticRing, { top: 0, left: 0, right: 0, bottom: 0, borderColor: 'rgba(255,255,255,0.14)' }]} />
          <View style={[styles.staticRing, { top: 37, left: 37, right: 37, bottom: 37 }]} />
          <View style={[styles.staticRing, { top: 74, left: 74, right: 74, bottom: 74 }]} />
          <PulseRing durationMs={ringDurMs} />
          <PulseRing durationMs={ringDurMs} phaseOffsetMs={ringDurMs / 2} />
          <View style={styles.centerDot} />
          {found && (
            <Animated.View
              style={[
                styles.blip,
                { transform: [{ translateX: blipPos.x }, { translateY: blipPos.y }] },
              ]}
            />
          )}
        </View>
      </View>

      <View style={styles.readout}>
        <Text style={styles.distValue}>
          {distLabel}
          <Text style={styles.distUnit}> m</Text>
        </Text>
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      <View style={styles.signalRow}>
        <View style={styles.sigBars}>
          {sigBars.map((b, i) => (
            <View
              key={i}
              style={{
                width: 4.5,
                borderRadius: 2,
                height: b.h,
                backgroundColor: b.on ? colors.radar : 'rgba(255,255,255,0.18)',
              }}
            />
          ))}
        </View>
        <Text style={styles.signalMeta}>{found && rssi != null ? `${rssi} dBm` : '– dBm'}</Text>
        <View style={styles.hapticGroup}>
          <View style={styles.waveBars}>
            <WaveBar durationMs={ringDurMs} delayMs={0} />
            <WaveBar durationMs={ringDurMs} delayMs={120} />
            <WaveBar durationMs={ringDurMs} delayMs={240} />
          </View>
          <Text style={styles.signalMeta}>haptic {(1000 / ringDurMs).toFixed(1)}/s</Text>
        </View>
      </View>

      <View style={styles.footer}>
        {inRange ? (
          <PrimaryButton
            label="Unlock lockbox"
            variant="white"
            onPress={() =>
              router.push({ pathname: '/unlock', params: { home: String(home.id) } })
            }
          />
        ) : (
          <View style={styles.outOfRange}>
            <Text style={styles.outOfRangeText}>
              Move within {IN_RANGE_THRESHOLD_M} m to unlock
            </Text>
          </View>
        )}
      </View>
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
    color: 'rgba(255,255,255,0.85)',
  },
  radarWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  radar: { width: RADAR_SIZE, height: RADAR_SIZE },
  staticRing: {
    position: 'absolute',
    borderRadius: RADAR_SIZE,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
  },
  pulseRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADAR_SIZE,
    borderWidth: 2,
    borderColor: colors.radar,
  },
  centerDot: {
    position: 'absolute',
    left: CENTER - 7,
    top: CENTER - 7,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.blueBright,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: colors.blueBright,
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  blip: {
    position: 'absolute',
    left: -9,
    top: -9,
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    shadowColor: colors.radar,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  readout: { alignItems: 'center' },
  distValue: {
    fontSize: 64,
    fontWeight: '500',
    letterSpacing: -1.9,
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  distUnit: { fontSize: 24, fontWeight: '400', color: 'rgba(255,255,255,0.55)' },
  statusText: { fontSize: 14.5, color: colors.whiteMuted, marginTop: 10 },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
    marginTop: 22,
  },
  sigBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 20 },
  signalMeta: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.5)',
    fontVariant: ['tabular-nums'],
  },
  hapticGroup: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  waveBars: { flexDirection: 'row', alignItems: 'center', gap: 2.5, height: 16 },
  waveBar: { width: 3, height: 15, borderRadius: 2, backgroundColor: colors.radar },
  footer: { marginHorizontal: 20, marginTop: 26, marginBottom: 12 },
  outOfRange: {
    height: 54,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfRangeText: { fontSize: 14, color: 'rgba(255,255,255,0.55)' },
});
