type RouteStats = {
  calls: number;
  errors: number;
  avgLatencyMs: number;
};

type StatusBreakdown = {
  "2xx": number;
  "3xx": number;
  "4xx": number;
  "5xx": number;
};

type TimelinePoint = {
  minute: string;
  requests: number;
  errors: number;
  rateLimited: number;
};

type ApiMetricsState = {
  startedAt: string;
  totalRequests: number;
  totalErrors: number;
  totalRateLimitExceeded: number;
  routes: Record<string, RouteStats>;
  statusBreakdown: StatusBreakdown;
  timeline: TimelinePoint[];
  lastErrorCode?: string;
};

export type ApiMetricsSnapshot = {
  startedAt: string;
  totalRequests: number;
  totalErrors: number;
  totalRateLimitExceeded: number;
  routes: Record<string, RouteStats>;
  statusBreakdown: StatusBreakdown;
  lastErrorCode?: string;
  recent: {
    windowMinutes: number;
    points: TimelinePoint[];
  };
};

function createInitialState(): ApiMetricsState {
  return {
    startedAt: new Date().toISOString(),
    totalRequests: 0,
    totalErrors: 0,
    totalRateLimitExceeded: 0,
    routes: {},
    statusBreakdown: {
      "2xx": 0,
      "3xx": 0,
      "4xx": 0,
      "5xx": 0
    },
    timeline: []
  };
}

let state: ApiMetricsState = createInitialState();

function getRouteKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

function getStatusGroup(statusCode: number): keyof StatusBreakdown {
  if (statusCode >= 500) {
    return "5xx";
  }

  if (statusCode >= 400) {
    return "4xx";
  }

  if (statusCode >= 300) {
    return "3xx";
  }

  return "2xx";
}

function getMinuteBucket(date: Date): string {
  const minute = new Date(date);
  minute.setSeconds(0, 0);
  return minute.toISOString();
}

function updateTimeline(now: Date, statusCode: number): void {
  const bucket = getMinuteBucket(now);
  const existing = state.timeline.find((point) => point.minute === bucket);

  if (!existing) {
    state.timeline.push({
      minute: bucket,
      requests: 1,
      errors: statusCode >= 400 ? 1 : 0,
      rateLimited: statusCode === 429 ? 1 : 0
    });
    return;
  }

  existing.requests += 1;
  if (statusCode >= 400) {
    existing.errors += 1;
  }
  if (statusCode === 429) {
    existing.rateLimited += 1;
  }
}

function pruneTimeline(windowMinutes: number): void {
  const threshold = Date.now() - windowMinutes * 60 * 1000;
  state.timeline = state.timeline.filter((point) => Date.parse(point.minute) >= threshold);
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
  if (input.statusCode >= 400) {
    state.totalErrors += 1;
  }

  const statusGroup = getStatusGroup(input.statusCode);
  state.statusBreakdown[statusGroup] += 1;

  updateTimeline(new Date(), input.statusCode);
  pruneTimeline(120);

  state.routes[routeKey] = {
    calls: nextCalls,
    errors: previous.errors + (input.statusCode >= 400 ? 1 : 0),
    avgLatencyMs: Number(nextAvgLatencyMs.toFixed(2))
  };
}

export function recordApiError(errorCode: string): void {
  state.lastErrorCode = errorCode;
  if (errorCode === "API_RATE_LIMIT_EXCEEDED") {
    state.totalRateLimitExceeded += 1;
  }
}

export function getApiMetrics(windowMinutes = 15): ApiMetricsSnapshot {
  const boundedWindow = Math.max(1, Math.min(120, windowMinutes));
  const threshold = Date.now() - boundedWindow * 60 * 1000;
  const points = state.timeline
    .filter((point) => Date.parse(point.minute) >= threshold)
    .sort((a, b) => a.minute.localeCompare(b.minute));

  return {
    startedAt: state.startedAt,
    totalRequests: state.totalRequests,
    totalErrors: state.totalErrors,
    totalRateLimitExceeded: state.totalRateLimitExceeded,
    routes: { ...state.routes },
    statusBreakdown: { ...state.statusBreakdown },
    lastErrorCode: state.lastErrorCode,
    recent: {
      windowMinutes: boundedWindow,
      points
    }
  };
}

export function resetApiMetricsForTests(): void {
  state = createInitialState();
}
