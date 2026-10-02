import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { QuitDatePicker } from '@/features/onboarding/QuitDatePicker';
import { spacing } from '@/theme/tokens';
import { AppText } from '@/ui/AppText';
import { Button } from '@/ui/Button';

type SmokeLoggerProps = {
  // 'lapse' is the quit-journey flow: it restarts the smoke-free clock. 'log' just records a cigarette.
  kind: 'log' | 'lapse';
  busy: boolean;
  onSubmit: (smokedAt: Date) => Promise<void>;
};

export function SmokeLogger({ kind, busy, onSubmit }: SmokeLoggerProps) {
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState(() => new Date());

  function openPanel() {
    setWhen(new Date());
    setOpen(true);
  }

  async function submit() {
    try {
      await onSubmit(when);
      setOpen(false);
    } catch {
      // The caller surfaces the error; keep the panel open so the time can be corrected.
    }
  }

  if (!open) {
    return (
      <Button
        label={kind === 'lapse' ? 'I had a cigarette' : 'Log earlier'}
        variant={kind === 'lapse' ? 'ghost' : 'secondary'}
        accessibilityHint={
          kind === 'lapse'
            ? 'Records a cigarette and restarts your smoke-free clock'
            : 'Records a cigarette at a time you choose'
        }
        onPress={openPanel}
      />
    );
  }

  return (
    <View style={styles.panel}>
      {kind === 'lapse' ? (
        <AppText variant="caption" tone="secondary">
          A slip does not erase your progress. Your longest smoke-free streak is kept, and your
          clock restarts from the time you choose.
        </AppText>
      ) : null}
      <QuitDatePicker
        value={when}
        onChange={setWhen}
        disabled={busy}
        label={kind === 'lapse' ? 'When was it?' : 'When did you smoke?'}
      />
      <Button
        label={busy ? 'Saving…' : kind === 'lapse' ? 'Record and restart' : 'Save'}
        disabled={busy}
        onPress={() => void submit()}
      />
      <Button label="Cancel" variant="ghost" disabled={busy} onPress={() => setOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.sm,
  },
});
