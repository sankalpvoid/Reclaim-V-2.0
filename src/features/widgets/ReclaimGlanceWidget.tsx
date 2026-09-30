import { Text, VStack } from '@expo/ui/swift-ui';
import { font, foregroundStyle, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { ReclaimWidgetSnapshot } from './widgetModel';

function ReclaimGlanceWidget(
  props: ReclaimWidgetSnapshot,
  environment: WidgetEnvironment,
) {
  'widget';

  if (environment.widgetFamily === 'accessoryInline') {
    return <Text>{props.primary} · {props.eyebrow}</Text>;
  }

  if (environment.widgetFamily === 'accessoryRectangular') {
    return (
      <VStack modifiers={[padding({ all: 4 })]}>
        <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle('#A855F7')]}>{props.eyebrow}</Text>
        <Text modifiers={[font({ size: 20, weight: 'bold' })]}>{props.primary}</Text>
        <Text modifiers={[font({ size: 11 })]}>{props.secondary}</Text>
      </VStack>
    );
  }

  return (
    <VStack modifiers={[padding({ all: 12 })]}>
      <Text
        modifiers={[
          font({ size: 11, weight: 'semibold' }),
          foregroundStyle('#A855F7'),
        ]}
      >
        {props.eyebrow}
      </Text>
      <Text modifiers={[font({ size: 28, weight: 'bold' })]}>{props.primary}</Text>
      <Text
        modifiers={[
          font({ size: 13 }),
          foregroundStyle('#8E8E93'),
        ]}
      >
        {props.secondary}
      </Text>
    </VStack>
  );
}

export default createWidget('ReclaimGlance', ReclaimGlanceWidget);
