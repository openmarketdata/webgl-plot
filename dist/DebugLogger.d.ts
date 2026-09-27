/**
 * Debug logging utility for webgl-plot
 * Provides centralized debug logging with [webglplot] prefix
 */
export declare class DebugLogger {
    private static debugEnabled;
    /**
     * Set debug mode globally
     */
    static setDebugMode(enabled: boolean): void;
    /**
     * Get current debug mode status
     */
    static isDebugEnabled(): boolean;
    /**
     * Debug log - only shows when debug mode is enabled
     */
    static log(message: string): void;
    /**
     * Debug warn - only shows when debug mode is enabled
     */
    static warn(message: string): void;
    /**
     * Error logging - always shows (not affected by debug flag)
     */
    static error(message: string): void;
}
//# sourceMappingURL=DebugLogger.d.ts.map