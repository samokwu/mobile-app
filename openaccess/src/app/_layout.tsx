import { Stack } from 'expo-router';

import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
      <Stack.Screen name="route" />
      <Stack.Screen
        name="finder"
        options={{ contentStyle: { backgroundColor: colors.navy } }}
      />
      <Stack.Screen
        name="unlock"
        options={{ contentStyle: { backgroundColor: colors.navy } }}
      />
    </Stack>
  );
}
