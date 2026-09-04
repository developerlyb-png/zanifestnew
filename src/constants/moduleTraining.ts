// Single source of truth for how long each of the 3 POSP training modules
// must be actively viewed before it auto-completes and advances.
// Imported by BOTH the client (VideoLectureDashboard.tsx) and the server
// (api/agent/module-progress.ts) so they can never drift out of sync.
export const MODULE_SECONDS = 1 * 60; // TESTING: 1 minute per module (was 5 * 60 * 60 = 5 hours; revert before going live)
