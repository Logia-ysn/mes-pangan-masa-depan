import { registerWorkOrderListeners } from './work-order-listener';

/**
 * Register all production event listeners.
 * Call this once at server startup.
 */
export function registerEventListeners() {
    registerWorkOrderListeners();
    console.log('[EventSystem] All production event listeners registered');
}
