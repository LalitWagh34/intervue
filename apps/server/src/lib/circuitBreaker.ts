import CircuitBreaker from "opossum";
import { logger } from "./logger.js";

const options = {
  timeout: 5000, // If function takes longer than 5 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, trip the breaker
  resetTimeout: 30000, // After 30 seconds, try again
};

export const createCircuitBreaker = <T extends (...args: any[]) => any>(
  name: string,
  fn: T
): CircuitBreaker => {
  const breaker = new CircuitBreaker(fn, options);

  breaker.on("open", () => logger.warn(`[CircuitBreaker] ${name} is OPEN!`));
  breaker.on("halfOpen", () => logger.info(`[CircuitBreaker] ${name} is HALF-OPEN`));
  breaker.on("close", () => logger.info(`[CircuitBreaker] ${name} is CLOSED`));

  return breaker;
};
