import type { EventType, Platform, Tone, PlatformStatRow } from "./types";

/**
 * Base weights — hard-coded starting priors per (event_type, platform).
 * These are the defaults before any human choices are recorded.
 *
 * Source: plan.md §12.2
 */
const BASE_WEIGHTS: Record<EventType, Partial<Record<Platform, number>>> = {
  launch: {
    twitter: 0.8,
    reddit: 0.7,
    whatsapp: 0.5,
    linkedin: 0.6,
    telegram: 0.45,
    facebook: 0.4,
  },
  milestone: {
    twitter: 0.9,
    reddit: 0.6,
    whatsapp: 0.5,
    linkedin: 0.7,
    telegram: 0.45,
    facebook: 0.4,
  },
  new_version: {
    twitter: 0.6,
    reddit: 0.5,
    whatsapp: 0.4,
    linkedin: 0.7,
    telegram: 0.45,
    facebook: 0.35,
  },
  // new_review rows score lower — this event type is mostly about the reply draft
  new_review: {
    twitter: 0.3,
    reddit: 0.2,
    whatsapp: 0.2,
    linkedin: 0.3,
    telegram: 0.15,
    facebook: 0.15,
  },
};

const ADJUSTMENT_FACTOR = 0.5;

/**
 * Compute the final rank score for a post variant.
 *
 * Formula (plan.md §12.3):
 *   score = base_weight(event_type, platform)
 *         + ADJUSTMENT_FACTOR × (times_chosen / max(times_shown, 1))
 */
export function computeRankScore(
  eventType: EventType,
  platform: Platform,
  tone: Tone,
  stats: PlatformStatRow[]
): number {
  const base = BASE_WEIGHTS[eventType]?.[platform] ?? 0.4;

  const row = stats.find((s) => s.platform === platform && s.tone === tone);
  const timesShown = row?.times_shown ?? 0;
  const timesChosen = row?.times_chosen ?? 0;
  const choiceRatio = timesShown > 0 ? timesChosen / timesShown : 0;

  return parseFloat((base + ADJUSTMENT_FACTOR * choiceRatio).toFixed(4));
}
