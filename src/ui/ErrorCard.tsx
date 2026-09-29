import { StyleSheet } from 'react-native';

import { colors } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';

type ErrorCardProps = {
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  retryLabel?: string;
};

export function ErrorCard({
  message,
  onRetry,
  isRetrying = false,
  retryLabel = 'Try again',
}: ErrorCardProps) {
  return (
    <Card style={styles.card}>
      <AppText accessibilityLiveRegion="polite" accessibilityRole="alert" tone="danger">
        {message}
      </AppText>
      {onRetry ? (
        <Button
          label={isRetrying ? 'Retrying…' : retryLabel}
          disabled={isRetrying}
          onPress={onRetry}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.danger,
  },
});
