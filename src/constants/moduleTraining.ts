// Single source of truth for how long each of the 3 POSP training modules
// must be actively viewed before it auto-completes and advances.
// Imported by BOTH the client (VideoLectureDashboard.tsx) and the server
// (api/agent/module-progress.ts) so they can never drift out of sync.
//
// TEMPORARY TESTING VALUE — set back to `5 * 60 * 60` (5 hours per module,
// 15 hours total) before going live.
export const MODULE_SECONDS = 60; // 1 minute per module, for testing only

// TEMPORARY TESTING FLAG — when true, VideoLectureDashboard skips the exam
// entirely once all 3 modules finish and auto-passes the agent straight to
// trainingCompleted + certificate generation. Set to false before going live
// so agents take the real assessment again.
export const SKIP_TEST_FOR_TESTING = true;
