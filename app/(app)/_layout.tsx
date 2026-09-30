import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';

const tabMarker = ({ color, focused }: { color: string; focused: boolean }) => (
  <View style={[styles.marker, { backgroundColor: color }, focused ? styles.markerActive : null]} />
);

export default function AppTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentLight,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarHideOnKeyboard: true,
        tabBarIcon: tabMarker,
        tabBarIconStyle: {
          height: 8,
          marginBottom: -2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.15,
          marginTop: 0,
        },
        tabBarStyle: {
          backgroundColor: colors.backgroundRaised,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 78 : 64,
          paddingTop: spacing.sm,
          paddingBottom: Platform.OS === 'ios' ? spacing.lg : spacing.sm,
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
      <Tabs.Screen name="journey" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="privacy" options={{ href: null }} />
    </Tabs>
  );
}


const styles = StyleSheet.create({
  marker: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.45,
  },
  markerActive: {
    width: 18,
    opacity: 1,
  },
});
