import { Text } from 'react-native';
import { Screen } from '@/ui/Screen';
import { colors, typography } from '@/theme/tokens';

export default function OnboardingShell() {
  return (
    <Screen>
      <Text style={{ color: colors.textPrimary, fontSize: typography.title }}>
        Onboarding shell
      </Text>
    </Screen>
  );
}
