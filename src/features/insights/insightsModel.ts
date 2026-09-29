import { parseCravingToolKey, type CravingToolKey } from '../craving/cravingModel';

export type InsightAction = {
  label: string;
  route: '/(app)' | '/(app)/craving' | '/(app)/check-in';
  tool?: CravingToolKey;
};

export type Insight = {
  id: string;
  title: string;
  body: string;
  evidence: string;
  confidence: 'emerging' | 'established';
  action: InsightAction;
};

type SmokingEvent = {
  smoked_at: string;
  event_type: string;
  cigarettes?: number | null | undefined;
  toolkit?: string | null | undefined;
  tool_feedback?: string | null | undefined;
};

type Checkin = { mood: string; created_at: string };

const helpfulFeedback = new Set(['yes', 'a_little']);
const toolLabels: Record<string, string> = {
  timer: 'Ride the wave',
  breathe: 'Box breathing',
  walk: 'Take a short walk',
  water: 'Water reset',
};

function periodForHour(hour: number) {
  if (hour < 6) return 'overnight';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'late night';
}

function sumCigarettes(events: SmokingEvent[]) {
  return events.reduce((total, event) => total + Math.max(0, event.cigarettes ?? 1), 0);
}

export function buildInsights(events: SmokingEvent[], checkins: Checkin[], now = new Date()): Insight[] {
  const insights: Insight[] = [];
  const cravings = events.filter((event) => event.event_type === 'craving');

  if (cravings.length >= 3) {
    const counts = new Map<string, number>();
    cravings.forEach((event) => {
      const period = periodForHour(new Date(event.smoked_at).getHours());
      counts.set(period, (counts.get(period) ?? 0) + 1);
    });
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] / cravings.length >= 0.5) {
      insights.push({
        id: 'craving-time',
        title: `${top[0][0]?.toUpperCase()}${top[0].slice(1)} cravings stand out`,
        body: `Most of your logged cravings are happening in the ${top[0]}.`,
        evidence: `${top[1]} of ${cravings.length} logged cravings`,
        confidence: cravings.length >= 6 ? 'established' : 'emerging',
        action: {
          label: 'Open craving support',
          route: '/(app)/craving',
        },
      });
    }
  }

  const toolRows = cravings.filter((event) => event.toolkit && event.tool_feedback);
  if (toolRows.length >= 3) {
    const tools = new Map<string, { helpful: number; total: number }>();
    toolRows.forEach((event) => {
      const key = event.toolkit!;
      const current = tools.get(key) ?? { helpful: 0, total: 0 };
      current.total += 1;
      if (helpfulFeedback.has(event.tool_feedback!)) current.helpful += 1;
      tools.set(key, current);
    });
    const best = [...tools.entries()]
      .filter(([, stats]) => stats.total >= 2)
      .sort((a, b) => b[1].helpful / b[1].total - a[1].helpful / a[1].total)[0];
    const bestTool = parseCravingToolKey(best?.[0]);
    if (best && bestTool && best[1].helpful / best[1].total >= 0.67) {
      insights.push({
        id: 'tool-effectiveness',
        title: `${toolLabels[bestTool]} is helping`,
        body: 'Your own feedback suggests this coping tool is worth trying first during a craving.',
        evidence: `${best[1].helpful} helpful ratings from ${best[1].total} uses`,
        confidence: best[1].total >= 4 ? 'established' : 'emerging',
        action: {
          label: `Use ${toolLabels[bestTool]}`,
          route: '/(app)/craving',
          tool: bestTool,
        },
      });
    }
  }

  if (checkins.length >= 3) {
    const hard = checkins.filter((row) => ['struggling', 'craving'].includes(row.mood)).length;
    if (hard / checkins.length >= 0.5) {
      insights.push({
        id: 'mood-load',
        title: 'Recent days have felt harder',
        body: 'Half or more of your recent check-ins reflect struggle or cravings. Reclaim can prioritize support over pressure.',
        evidence: `${hard} of ${checkins.length} recent check-ins`,
        confidence: checkins.length >= 7 ? 'established' : 'emerging',
        action: {
          label: 'Open support',
          route: '/(app)/craving',
        },
      });
    }
  }

  const smoked = events.filter((event) => event.event_type === 'smoked');
  const day = 86_400_000;
  const currentStart = now.getTime() - 7 * day;
  const previousStart = now.getTime() - 14 * day;
  const currentRows = smoked.filter((event) => new Date(event.smoked_at).getTime() >= currentStart);
  const previousRows = smoked.filter((event) => {
    const time = new Date(event.smoked_at).getTime();
    return time >= previousStart && time < currentStart;
  });
  const current = sumCigarettes(currentRows);
  const previous = sumCigarettes(previousRows);
  if (previous >= 3 && current < previous) {
    const drop = Math.round(((previous - current) / previous) * 100);
    insights.push({
      id: 'smoking-trend',
      title: 'Your logged smoking is trending down',
      body: 'The last seven days contain fewer logged cigarettes than the seven days before them.',
      evidence: `${previous} → ${current} logged cigarettes · ${drop}% lower`,
      confidence: previous + current >= 10 ? 'established' : 'emerging',
      action: {
        label: 'View today',
        route: '/(app)',
      },
    });
  }

  return insights;
}
