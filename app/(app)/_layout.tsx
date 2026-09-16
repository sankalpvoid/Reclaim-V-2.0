import { Tabs } from 'expo-router';

import { colors, spacing } from '@/theme/tokens';

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingTop: spacing.xs,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Today' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
      <Tabs.Screen name="community" options={{ title: 'Community' }} />
      <Tabs.Screen name="learning" options={{ title: 'Learn' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />

      <Tabs.Screen name="check-in" options={{ href: null }} />
      <Tabs.Screen name="craving" options={{ href: null }} />
      <Tabs.Screen name="goals" options={{ href: null }} />
      <Tabs.Screen name="health" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
