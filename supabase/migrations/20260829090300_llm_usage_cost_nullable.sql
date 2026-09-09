-- llm_usage.cost_estimate: null means "unknown", not "free".
--
-- The wrapper only knows prices for models in its table. Storing 0 for an
-- unknown model would make usage reports silently under-count spend, so the
-- column may be null and the default is removed rather than left at 0.

alter table public.llm_usage
  alter column cost_estimate drop not null,
  alter column cost_estimate drop default;

comment on column public.llm_usage.cost_estimate is
  'Estimated cost in USD (OpenRouter prices) from the wrapper price table; null when the model price is unknown.';
