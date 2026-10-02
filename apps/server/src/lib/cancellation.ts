/**
 * Centralized Cancellation Token Registry (AbortController Manager)
 * 
 * Reclaims CPU and Docker resources when:
 * 1. A candidate clicks "Run" again before a previous run finishes (superseded execution).
 * 2. A candidate navigates away or closes the browser tab.
 * 3. A client issues an explicit DELETE /jobs/:id cancellation request.
 */
export class CancellationManager {
  private controllers: Map<string, AbortController> = new Map();

  /**
   * Generates a new AbortSignal for the given key.
   * If an active controller already exists for this key, it is automatically aborted
   * with reason 'Superseded by newer execution'.
   */
  createToken(key: string): AbortSignal {
    const existing = this.controllers.get(key);
    if (existing) {
      try {
        existing.abort("Superseded by newer execution");
      } catch {}
      this.controllers.delete(key);
    }

    const controller = new AbortController();
    this.controllers.set(key, controller);
    return controller.signal;
  }

  /**
   * Cancel an in-flight operation by key.
   */
  cancel(key: string, reason: string = "Execution cancelled"): boolean {
    const controller = this.controllers.get(key);
    if (!controller) {
      return false;
    }

    try {
      controller.abort(reason);
    } catch {}

    this.controllers.delete(key);
    return true;
  }

  /**
   * Get the current AbortSignal for a key if active.
   */
  getSignal(key: string): AbortSignal | undefined {
    return this.controllers.get(key)?.signal;
  }

  /**
   * Clean up controller on job completion.
   */
  cleanup(key: string): void {
    this.controllers.delete(key);
  }
}

export const cancellationManager = new CancellationManager();
