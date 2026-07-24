import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HOMES, VENDOR, type Home } from '@/data/demo';
import { colors, radii } from '@/theme';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLabel() {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const month = now.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return `${weekday} · ${month} ${now.getDate()}`;
}

function VisitCard({ home, onPress }: { home: Home; onPress: () => void }) {
  const isHpm = home.kind === 'HPM visit';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { borderColor: colors.inkFaint }]}
    >
      <View style={styles.cardBody}>
        <Text style={styles.cardAddr}>{home.addr}</Text>
        <View style={styles.cardMetaRow}>
          <Text style={styles.cardTime}>{home.time}</Text>
          <Text style={styles.cardCity}>{home.city}</Text>
        </View>
        <View style={styles.cardPillRow}>
          <View
            style={[
              styles.kindPill,
              { backgroundColor: isHpm ? colors.blueTint : colors.tile },
            ]}
          >
            <Text
              style={[
                styles.kindPillText,
                { color: isHpm ? colors.blueDark : colors.inkStrong },
              ]}
            >
              {home.kind}
            </Text>
          </View>
          <Text style={styles.battText}>Battery {home.batt}%</Text>
        </View>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export default function TodayScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>
            Open<Text style={{ color: colors.blue }}>Access</Text>
          </Text>
          <Pressable
            onPress={() => router.push('/profile')}
            hitSlop={10}
            style={({ pressed }) => [styles.avatar, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.avatarText}>{VENDOR.initials}</Text>
          </Pressable>
        </View>

        <View style={styles.greetingBlock}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.greetingSub}>{HOMES.length} lockbox visits today</Text>
        </View>

        <Text style={styles.dateLabel}>{todayLabel()}</Text>

        <View style={styles.cards}>
          {HOMES.map((home) => (
            <VisitCard
              key={home.id}
              home={home}
              onPress={() =>
                router.push({ pathname: '/route', params: { home: String(home.id) } })
              }
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 40 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    fontSize: 17,
    fontWeight: '500',
    letterSpacing: -0.17,
    color: colors.ink,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.blueTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '700', color: colors.blueDark },
  greetingBlock: { paddingHorizontal: 24, paddingTop: 26 },
  greeting: {
    fontSize: 28,
    fontWeight: '500',
    letterSpacing: -0.56,
    lineHeight: 32,
    color: colors.ink,
  },
  greetingSub: { fontSize: 15, color: colors.inkMuted, marginTop: 6 },
  dateLabel: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 10,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.88,
    color: colors.inkFaint,
  },
  cards: { paddingHorizontal: 20, gap: 12 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardBody: { flex: 1, gap: 7 },
  cardAddr: {
    fontSize: 16.5,
    fontWeight: '500',
    letterSpacing: -0.17,
    color: colors.ink,
  },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTime: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.inkStrong,
    fontVariant: ['tabular-nums'],
  },
  cardCity: { fontSize: 13, color: colors.inkMuted },
  cardPillRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  kindPill: {
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: radii.pill,
  },
  kindPillText: { fontSize: 11.5, fontWeight: '500' },
  battText: {
    fontSize: 11.5,
    color: colors.inkFaint,
    fontVariant: ['tabular-nums'],
  },
  chevron: { fontSize: 20, fontWeight: '500', color: colors.border },
});
