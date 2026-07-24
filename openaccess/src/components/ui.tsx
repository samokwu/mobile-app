import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, radii } from '@/theme';

// Small "‹ Back"-style pill used on the map/finder/unlock screens.
export function BackPill({
  label,
  onPress,
  dark = false,
  style,
}: {
  label: string;
  onPress: () => void;
  dark?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.backPill,
        dark
          ? { backgroundColor: 'rgba(255,255,255,0.12)' }
          : {
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderWidth: 1,
              borderColor: colors.border,
            },
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Text style={[styles.backPillText, { color: dark ? '#FFFFFF' : colors.ink }]}>
        ‹ {label}
      </Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'blue',
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'blue' | 'white';
  style?: ViewStyle;
}) {
  const isBlue = variant === 'blue';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.primary,
        { backgroundColor: isBlue ? colors.blue : '#FFFFFF' },
        pressed && { backgroundColor: isBlue ? colors.blueDark : '#E8E8EE' },
        style,
      ]}
    >
      <Text
        style={[
          styles.primaryText,
          isBlue ? { color: '#FFFFFF', fontWeight: '500' } : { color: colors.navy, fontWeight: '700' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radii.pill,
    alignSelf: 'flex-start',
  },
  backPillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  primary: {
    height: 54,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontSize: 16,
    letterSpacing: -0.16,
  },
});
