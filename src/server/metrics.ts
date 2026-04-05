type RouteStats = {
  calls: number;
  errors: number;
  avgLatencyMs: number;
};

type ApiMetricsState = {
  startedAt: string;
  totalRequests: number;
  totalErrors: number;
  totalRateLimitExceeded: number;
  routes: Record<string, RouteStats>;
  lastErrorCode?: string;
};

function createInitialState(): ApiMetricsState {
  return {
    startedAt: new Date().toISOString(),
    totalRequests: 0,
    totalErrors: 0,
    totalRateLimitExceeded: 0,
    routes: {}
  };
}

let state: ApiMetricsState = createInitialState();

function getRouteKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

export function recordApiRequest(input: {
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
}): void {
  const routeKey = getRouteKey(input.method, input.path);
  const previous = state.routes[routeKey] ?? {
    calls: 0,
    errors: 0,
    avgLatencyMs: 0
  };

  const nextCalls = previous.calls + 1;
  const nextAvgLatencyMs = (previous.avgLatencyMs * previous.calls + input.latencyMs) / nextCalls;

  state.totalRequests += 1;
  state.routes[routeKey] = {
    calls: nextCalls,
    errors: previous.errors + (input.statusCode >= 400 ? 1 : 0),
    avgLatencyMs: Number(nextAvgLatencyMs.toFixed(2))
  };
}

export function recordApiError(errorCode: string): void {
  state.totalErrors += 1;
  state.lastErrorCode = errorCode;
  if (errorCode === "API_RATE_LIMIT_EXCEEDED") {
    state.totalRateLimitExceeded += 1;
  }
}

export function getApiMetrics(): ApiMetricsState {
  return {
    ...state,
    routes: { ...state.routes }
  };
}

export function resetApiMetricsForTests(): void {
  state = createInitialState();
}
