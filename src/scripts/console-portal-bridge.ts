/** The same-origin handheld and its screen share a small lifecycle contract. */
export interface ConsolePortalApi {
  prepare(): Promise<void>;
  enter(): void;
  leave(): void;
}
declare global { interface Window { toamigConsolePortal?: ConsolePortalApi; } }
