import { Image, StyleSheet, View } from 'react-native';

import { colors } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type BrandMarkProps = {
  showWordmark?: boolean;
  compact?: boolean;
};

const BRAND_ICON = require('../../assets/branding/icon.png');

export function BrandMark({ showWordmark = true, compact = false }: BrandMarkProps) {
  const size = compact ? 28 : 38;
  const cornerRadius = compact ? 8 : 11;

  return (
    <View style={styles.row}>
      <Image
        accessibilityElementsHidden
        importantForAccessibility="no"
        source={BRAND_ICON}
        resizeMode="contain"
        style={{ width: size, height: size, borderRadius: cornerRadius }}
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
