import { registerWorkOrderListeners } from './work-order-listener';
import { registerNCRListeners } from './ncr-listener';

/**
 * Register all production event listeners.
 * Call this once at server startup.
 */
export function registerEventListeners() {
    registerWorkOrderListeners();
    registerNCRListeners();
    console.log('[EventSystem] All production event listeners registered');
}
