import { Tabs } from 'expo-router';

import { colors, spacing } from '@/theme/tokens';

const noIcon = () => null;

export default function AppTabsLayout() {
  return (
    <Tabs
      implementation="custom"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarIcon: noIcon,
        tabBarIconStyle: {
          display: 'none',
        },
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
      <Tabs.Screen name="index" options={{ title: 'Today', tabBarAccessibilityLabel: 'Today tab' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarAccessibilityLabel: 'Insights tab' }} />
      <Tabs.Screen name="community" options={{ title: 'Community', tabBarAccessibilityLabel: 'Community tab' }} />
      <Tabs.Screen name="learning" options={{ title: 'Learn', tabBarAccessibilityLabel: 'Learn tab' }} />
      <Tabs.Screen name="more" options={{ title: 'More', tabBarAccessibilityLabel: 'More tab' }} />

      <Tabs.Screen name="check-in" options={{ href: null }} />
      <Tabs.Screen name="craving" options={{ href: null }} />
      <Tabs.Screen name="goals" options={{ href: null }} />
      <Tabs.Screen name="health" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
