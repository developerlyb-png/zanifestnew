// Single source of truth for how long each of the 3 POSP training modules
// must be actively viewed before it auto-completes and advances.
// Imported by BOTH the client (VideoLectureDashboard.tsx) and the server
// (api/agent/module-progress.ts) so they can never drift out of sync.
export const MODULE_SECONDS = 5 * 60 * 60; // 5 hours per module (15 hours total across all 3 modules)

// When true, VideoLectureDashboard skips the exam entirely once all 3
// modules finish and auto-passes the agent straight to trainingCompleted +
// certificate generation. Kept as a flag (rather than deleted) since it was
// useful for testing — leave false for the real assessment to apply.
export const SKIP_TEST_FOR_TESTING = false;
