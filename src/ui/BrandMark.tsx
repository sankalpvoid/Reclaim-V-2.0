import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';

type BrandMarkProps = {
  showWordmark?: boolean;
  compact?: boolean;
};

export function BrandMark({ showWordmark = true, compact = false }: BrandMarkProps) {
  const size = compact ? 28 : 38;
  const stroke = compact ? 5 : 6;

  return (
    <View style={styles.row}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no"
        style={[
          styles.mark,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
          },
        ]}
      >
        <View style={[styles.exit, compact ? styles.exitCompact : null]} />
      </View>
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
  mark: {
    borderColor: colors.accent,
    borderRightColor: 'transparent',
    transform: [{ rotate: '-18deg' }],
    position: 'relative',
  },
  exit: {
    position: 'absolute',
    width: 17,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    right: -10,
    top: 0,
    transform: [{ rotate: '-38deg' }],
  },
  exitCompact: {
    width: 13,
    height: 5,
    right: -8,
  },
});
