// Encodes/decodes the cost calculator's own UI-level state to/from a URL query string, so a
// visitor's tuned configuration can live in the address bar (bookmark, copy, send to a colleague).
//
// Deliberately separate from `agentCost.ts`'s `CostInputs`: these fields are the raw values the
// component's inputs hold (e.g. `cachedSharePct` 0..100), not the derived shape `computeAgentCost`
// consumes (`cachedShare` 0..1) — the component still does that conversion itself.

import { MODEL_IDS, type ModelId } from './agentCost';

export type CostCalculatorFields = {
  tools: number;
  tokensPerToolSchema: number;
  systemPromptTokens: number;
  historyTokens: number;
  ragTokens: number;
  outputTokensPerStep: number;
  stepsMin: number;
  stepsMax: number;
  tasksPerDay: number;
  cachedSharePct: number;
  model: ModelId;
  euResidency: boolean;
};

const NUMBER_FIELDS = [
  'tools',
  'tokensPerToolSchema',
  'systemPromptTokens',
  'historyTokens',
  'ragTokens',
  'outputTokensPerStep',
  'stepsMin',
  'stepsMax',
  'tasksPerDay',
  'cachedSharePct',
] as const satisfies readonly (keyof CostCalculatorFields)[];

/**
 * Sets the ~12 keys this feature owns onto `params`, in place. Any other key already present
 * (UTM/campaign params a visitor arrived with, say) is left untouched.
 */
export function applyEstimateParams(params: URLSearchParams, fields: CostCalculatorFields): void {
  for (const key of NUMBER_FIELDS) params.set(key, String(fields[key]));
  params.set('model', fields.model);
  params.set('euResidency', fields.euResidency ? '1' : '0');
}

/**
 * Reads calculator fields back out of a query string (e.g. `location.search`). A missing or
 * invalid value for any single field falls back to that field in `defaults` — a partial or
 * hand-edited URL degrades field-by-field, not as an all-or-nothing reset.
 */
export function decodeEstimateQuery(
  search: string,
  defaults: CostCalculatorFields
): CostCalculatorFields {
  const params = new URLSearchParams(search);
  const result = { ...defaults };

  for (const key of NUMBER_FIELDS) {
    const raw = params.get(key);
    if (raw === null) continue;
    const n = Number(raw);
    if (Number.isFinite(n)) result[key] = n;
  }

  const modelRaw = params.get('model');
  if (modelRaw !== null && (MODEL_IDS as string[]).includes(modelRaw)) {
    result.model = modelRaw as ModelId;
  }

  const euRaw = params.get('euResidency');
  if (euRaw !== null) result.euResidency = euRaw === '1';

  return result;
}

/** Shallow equality over all 12 fields — used to decide whether state has drifted from defaults. */
export function estimateFieldsEqual(a: CostCalculatorFields, b: CostCalculatorFields): boolean {
  return (
    NUMBER_FIELDS.every((key) => a[key] === b[key]) &&
    a.model === b.model &&
    a.euResidency === b.euResidency
  );
}

/**
 * Whether `search` already carries calculator state. `tools` is always the first key this module
 * writes, so its presence is a reliable sentinel for "a shareable estimate link", distinguishing it
 * from a visitor arriving with no calculator state (or unrelated params) in the URL at all.
 */
export function hasEstimateParams(search: string): boolean {
  return new URLSearchParams(search).has('tools');
}
