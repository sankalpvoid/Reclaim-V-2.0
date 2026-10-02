import { useState } from 'react';

import { Input } from '@/ui/Input';

type QuitDatePickerProps = {
  value: Date;
  onChange: (value: Date) => void;
  disabled?: boolean;
  label?: string;
};

function toLocalInput(value: Date) {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function QuitDatePicker(props: QuitDatePickerProps) {
  return <QuitDatePickerDraft key={props.value.getTime()} {...props} />;
}

function QuitDatePickerDraft({
  value,
  onChange,
  disabled = false,
  label = 'Your quit date and time',
}: QuitDatePickerProps) {
  const [draft, setDraft] = useState(() => toLocalInput(value));

  return (
    <Input
      label={label}
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
