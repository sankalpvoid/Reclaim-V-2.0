import { Text } from 'react-native';
import { Screen } from '@/ui/Screen';
import { colors, typography } from '@/theme/tokens';

export default function MainAppShell() {
  return (
    <Screen>
      <Text style={{ color: colors.textPrimary, fontSize: typography.title }}>
        Main app shell
      </Text>
    </Screen>
  );
}
