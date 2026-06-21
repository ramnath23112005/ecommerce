import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface MetricRecord {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

interface SpanRecord {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  attributes: Record<string, any>;
  status: 'ok' | 'error';
}

class TelemetryService {
  private metrics: MetricRecord[] = [];
  private spans: SpanRecord[] = [];
  private readonly maxRecords = 10000;

  recordMetric(name: string, value: number, labels: Record<string, string> = {}): void {
    this.metrics.push({ name, value, labels, timestamp: new Date() });
    if (this.metrics.length > this.maxRecords) this.metrics.shift();
  }

  startSpan(name: string, attributes: Record<string, any> = {}): SpanRecord {
    const span: SpanRecord = {
      name,
      traceId: crypto.randomUUID(),
      spanId: crypto.randomUUID(),
      startTime: new Date(),
      attributes,
      status: 'ok',
    };
    return span;
  }

  endSpan(span: SpanRecord, status: 'ok' | 'error' = 'ok'): void {
    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();
    span.status = status;
    this.spans.push(span);
    if (this.spans.length > this.maxRecords) this.spans.shift();
  }

  getMetrics(): { metrics: MetricRecord[]; spans: SpanRecord[] } {
    return { metrics: this.metrics, spans: this.spans };
  }

  clear(): void {
    this.metrics = [];
    this.spans = [];
  }

  requestMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.recordMetric('http_request_duration_ms', duration, {
          method: req.method,
          path: req.route?.path || req.path,
          status: res.statusCode.toString(),
        });
        this.recordMetric('http_requests_total', 1, {
          method: req.method,
          status: res.statusCode.toString(),
        });
        if (res.statusCode >= 500) {
          logger.error(`[Telemetry] ${req.method} ${req.path} ${res.statusCode} (${duration}ms)`);
        }
      });
      next();
    };
  }

  getMetricsSummary(): any {
    const grouped = new Map<string, { count: number; totalDuration: number; errors: number }>();
    for (const span of this.spans) {
      const key = span.name;
      const existing = grouped.get(key) || { count: 0, totalDuration: 0, errors: 0 };
      existing.count++;
      existing.totalDuration += span.duration || 0;
      if (span.status === 'error') existing.errors++;
      grouped.set(key, existing);
    }

    return {
      spans: Object.fromEntries(grouped),
      recentErrors: this.spans.filter((s) => s.status === 'error').slice(-20),
    };
  }
}

import crypto from 'crypto';
export const telemetry = new TelemetryService();
