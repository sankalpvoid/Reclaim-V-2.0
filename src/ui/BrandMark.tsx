import { Image, StyleSheet, View } from 'react-native';

import { AppText } from '@/ui/AppText';

type BrandMarkProps = {
  showWordmark?: boolean;
  compact?: boolean;
};

export function BrandMark({ showWordmark = true, compact = false }: BrandMarkProps) {
  const size = compact ? 30 : 46;

  return (
    <View style={styles.row}>
      <Image
        accessibilityLabel="Reclaim"
        source={require('../../assets/branding/icon.png')}
        style={[styles.mark, { width: size, height: size, borderRadius: size * 0.24 }]}
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
  mark: {
    resizeMode: 'contain',
  },
});
