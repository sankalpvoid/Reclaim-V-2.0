import { useEffect, useState } from 'react';

import { Input } from '@/ui/Input';

type QuitDatePickerProps = {
  value: Date;
  onChange: (value: Date) => void;
  disabled?: boolean;
};

function toLocalInput(value: Date) {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function QuitDatePicker({ value, onChange, disabled = false }: QuitDatePickerProps) {
  const [draft, setDraft] = useState(() => toLocalInput(value));

  useEffect(() => {
    setDraft(toLocalInput(value));
  }, [value]);

  return (
    <Input
      label="Your quit date and time"
      value={draft}
      editable={!disabled}
      placeholder="YYYY-MM-DDTHH:mm"
      autoCapitalize="none"
      autoCorrect={false}
      onChangeText={setDraft}
      onEndEditing={() => {
        const parsed = new Date(draft);
        if (Number.isFinite(parsed.getTime()) && parsed.getTime() <= Date.now()) {
          onChange(parsed);
        } else {
          setDraft(toLocalInput(value));
        }
      }}
    />
  );
}
