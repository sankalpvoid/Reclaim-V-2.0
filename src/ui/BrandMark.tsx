import { Image, StyleSheet, View } from 'react-native';

import { AppText } from '@/ui/AppText';

type BrandMarkProps = {
  showWordmark?: boolean;
  compact?: boolean;
};

// Single source of truth for the in-app Reclaim mark.
// This must stay the exact approved app-icon artwork; do not redraw the mark in code.
const BRAND_ICON = require('../../assets/branding/icon.png');

export function BrandMark({ showWordmark = true, compact = false }: BrandMarkProps) {
  const size = compact ? 28 : 38;

  return (
    <View style={styles.row}>
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no"
        source={BRAND_ICON}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
      {showWordmark ? (
        <AppText variant={compact ? 'title' : 'headline'}>Reclaim</AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
