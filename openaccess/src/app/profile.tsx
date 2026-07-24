import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { HOMES, VENDOR } from '@/data/demo';
import { colors, radii } from '@/theme';

function InfoRow({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) {
  return (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.grabber} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{VENDOR.initials}</Text>
          </View>
          <Text style={styles.name}>{VENDOR.name}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{VENDOR.role}</Text>
          </View>
          <Text style={styles.company}>{VENDOR.company}</Text>
        </View>

        <Text style={styles.sectionLabel}>CREDENTIALS</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Vendor ID" value={VENDOR.vendorId} />
          <InfoRow label="Access level" value={VENDOR.accessLevel} />
          <InfoRow label="Visits today" value={`${HOMES.length} scheduled`} isLast />
        </View>

        <Text style={styles.sectionLabel}>CONTACT</Text>
        <View style={styles.infoCard}>
          <InfoRow label="Phone" value={VENDOR.phone} />
          <InfoRow label="Email" value={VENDOR.email} isLast />
        </View>

        <Text style={styles.footnote}>
          Credentials are verified by {VENDOR.company}. Every lockbox access is
          logged with your vendor ID.
        </Text>

        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.doneBtn, pressed && { backgroundColor: colors.blueDark }]}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  grabber: {
    width: 38,
    height: 4.5,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: 10,
  },
  scroll: { paddingBottom: 40 },
  identity: { alignItems: 'center', paddingTop: 28, gap: 10 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.blueTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: colors.blueDark },
  name: {
    fontSize: 24,
    fontWeight: '500',
    letterSpacing: -0.48,
    color: colors.ink,
    marginTop: 4,
  },
  rolePill: {
    backgroundColor: colors.blue,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radii.pill,
  },
  rolePillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 0.6 },
  company: { fontSize: 15, color: colors.inkMuted },
  sectionLabel: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 8,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.88,
    color: colors.inkFaint,
  },
  infoCard: {
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    paddingHorizontal: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    gap: 12,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: 15, color: colors.inkMuted },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.ink,
    flexShrink: 1,
    textAlign: 'right',
  },
  footnote: {
    paddingHorizontal: 24,
    paddingTop: 18,
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.inkFaint,
  },
  doneBtn: {
    marginHorizontal: 20,
    marginTop: 26,
    height: 54,
    borderRadius: radii.pill,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
});
