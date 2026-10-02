import client from "prom-client";

// Create a Registry
export const register = new client.Registry();

// Add default metrics (CPU, RAM, Event Loop Delay)
client.collectDefaultMetrics({ register });

// Custom Latency Metric
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "code"],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
});

register.registerMetric(httpRequestDurationMicroseconds);
