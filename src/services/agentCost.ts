// Cost model for running an LLM agent, used by the blog article's calculator.
//
// The point the article makes: an agent's bill is dominated by what gets RE-SENT on every
// step of the loop (system prompt + tool schemas + history + retrieved context), not by the
// user's question or the model's answer. So costs are computed per component, per step.
//
// Prompt caching is applied ONLY to the stable prefix (system prompt + tool schemas). History
// and retrieved context change between steps, so they are never served from cache.

export type ModelId =
  | 'gpt-5.6-sol'
  | 'gpt-5.6-terra'
  | 'gpt-5.6-luna'
  | 'gpt-5.5'
  | 'gpt-5.4'
  | 'gpt-5.4-mini'
  | 'gpt-5.4-nano';

export type ModelPrice = {
  /** USD per 1M input tokens. */
  input: number;
  /** USD per 1M input tokens served from the prompt cache. */
  cachedInput: number;
  /** USD per 1M output tokens. */
  output: number;
};

/** Date the prices below were read off OpenAI's pricing page. Shown in the calculator UI. */
export const PRICES_SNAPSHOT_DATE = '2026-07-25';

export const MODEL_PRICES: Record<ModelId, ModelPrice> = {
  'gpt-5.6-sol': { input: 5.0, cachedInput: 0.5, output: 30.0 },
  'gpt-5.6-terra': { input: 2.5, cachedInput: 0.25, output: 15.0 },
  'gpt-5.6-luna': { input: 1.0, cachedInput: 0.1, output: 6.0 },
  'gpt-5.5': { input: 5.0, cachedInput: 0.5, output: 30.0 },
  'gpt-5.4': { input: 2.5, cachedInput: 0.25, output: 15.0 },
  'gpt-5.4-mini': { input: 0.75, cachedInput: 0.075, output: 4.5 },
  'gpt-5.4-nano': { input: 0.2, cachedInput: 0.02, output: 1.25 },
};

export const MODEL_IDS = Object.keys(MODEL_PRICES) as ModelId[];

/** Billing month used for the monthly figure. Documented in the article's assumptions table. */
export const DAYS_PER_MONTH = 30;

/** Uplift for regional data-residency processing (models released after 2026-03-05). */
const EU_UPLIFT = 1.1;

export type CostComponent = 'toolSchemas' | 'systemPrompt' | 'history' | 'rag' | 'output';

/** Fixed order — the chart assigns its palette by this order and never cycles it. */
export const COST_COMPONENTS: CostComponent[] = [
  'toolSchemas',
  'systemPrompt',
  'history',
  'rag',
  'output',
];

export type CostInputs = {
  tools: number;
  tokensPerToolSchema: number;
  systemPromptTokens: number;
  historyTokens: number;
  ragTokens: number;
  outputTokensPerStep: number;
  stepsMin: number;
  stepsMax: number;
  tasksPerDay: number;
  /** 0..1 — share of the stable prefix served from cache. */
  cachedShare: number;
  model: ModelId;
  euResidency: boolean;
};

export type CostBreakdown = {
  /** USD per month, per component. */
  components: Record<CostComponent, number>;
  /** USD per month, all components. */
  monthly: number;
  /** USD for a single task. */
  perTask: number;
};

export type CostResult = {
  /** Optimistic end: fewest steps, cache as configured. */
  low: CostBreakdown;
  /** Pessimistic end: most steps, no cache at all. */
  high: CostBreakdown;
  snapshotDate: string;
};

/** Blank/negative/non-finite fields come from empty form inputs — treat them as zero. */
function safe(v: number): number {
  return Number.isFinite(v) && v > 0 ? v : 0;
}

function clampShare(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

function breakdown(i: CostInputs, rawSteps: number, rawCachedShare: number): CostBreakdown {
  const price = MODEL_PRICES[i.model] ?? MODEL_PRICES['gpt-5.4-mini'];
  const uplift = i.euResidency ? EU_UPLIFT : 1;
  const steps = safe(rawSteps);
  const cachedShare = clampShare(rawCachedShare);

  // Blended price for the cacheable prefix.
  const prefixPrice = (1 - cachedShare) * price.input + cachedShare * price.cachedInput;
  const cost = (tokens: number, perM: number) => (safe(tokens) * steps / 1_000_000) * perM * uplift;

  const perTask: Record<CostComponent, number> = {
    toolSchemas: cost(safe(i.tools) * safe(i.tokensPerToolSchema), prefixPrice),
    systemPrompt: cost(i.systemPromptTokens, prefixPrice),
    history: cost(i.historyTokens, price.input),
    rag: cost(i.ragTokens, price.input),
    output: cost(i.outputTokensPerStep, price.output),
  };

  const tasksPerMonth = safe(i.tasksPerDay) * DAYS_PER_MONTH;
  const components = {} as Record<CostComponent, number>;
  for (const key of COST_COMPONENTS) components[key] = perTask[key] * tasksPerMonth;

  const sum = (o: Record<CostComponent, number>) =>
    COST_COMPONENTS.reduce((acc, k) => acc + o[k], 0);

  return { components, monthly: sum(components), perTask: sum(perTask) };
}

export function computeAgentCost(inputs: CostInputs): CostResult {
  return {
    low: breakdown(inputs, inputs.stepsMin, inputs.cachedShare),
    high: breakdown(inputs, Math.max(safe(inputs.stepsMin), safe(inputs.stepsMax)), 0),
    snapshotDate: PRICES_SNAPSHOT_DATE,
  };
}
