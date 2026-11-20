// Safety net for the whole portal: every toast.error(...) — from any page or
// component, including ones that pass a server's raw message straight
// through — is run through humanizeErrorMessage first, so things like
// "E11000 duplicate key error ... dup key: { mobile: "62..." }" or
// "Cannot read properties of undefined" never reach the screen. Readable
// messages pass through unchanged. Imported once, for its side effect, from
// _app.tsx. (Server routes also send friendly messages themselves via
// friendlyMessage(); this catches anything that slips past.)
import toast from "react-hot-toast";
import { humanizeErrorMessage } from "@/utils/friendlyError";

const FLAG = "__zanifestFriendlyToasts";

if (!(toast as any)[FLAG]) {
  const original = toast.error;
  const patched = ((message: any, opts?: any) =>
    original(typeof message === "string" ? humanizeErrorMessage(message) : message, opts)) as typeof toast.error;
  toast.error = patched;
  (toast as any)[FLAG] = true;
}

export {};
