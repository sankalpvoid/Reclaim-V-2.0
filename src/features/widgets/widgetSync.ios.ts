import ReclaimGlanceWidget from './ReclaimGlanceWidget';
import type { ReclaimWidgetSnapshot } from './widgetModel';

export function syncReclaimGlanceWidget(snapshot: ReclaimWidgetSnapshot): void {
  ReclaimGlanceWidget.updateSnapshot(snapshot);
}
