// Turns raw technical errors (MongoDB duplicate keys, Mongoose validation /
// cast errors, network failures, JS crashes) into sentences an admin can act
// on — e.g. "E11000 duplicate key error collection: zanifest.users index:
// mobile_1 dup key: { mobile: "6280148814" }" becomes "This mobile number
// (6280148814) is already registered to another record."
//
// Isomorphic: used server-side by API routes (friendlyMessage(err)) and
// client-side as a safety net on every error toast (humanizeErrorMessage).
// Ordinary, already-readable messages ("Client not found", "Role is
// required") pass through unchanged — only messages that look technical are
// rewritten, so intentional `throw new Error("...")` text is never lost.

const FIELD_LABELS: Record<string, string> = {
  mobile: "mobile number",
  phone: "phone number",
  phoneNumber: "phone number",
  contactNo: "contact number",
  email: "email address",
  userEmail: "email address",
  username: "username",
  userName: "name",
  policyNumber: "policy number",
  policyNo: "policy number",
  managerId: "manager ID",
  agentCode: "agent code",
  pospCode: "POSP code",
  panNumber: "PAN number",
  pan: "PAN number",
  aadhaarNumber: "Aadhaar number",
  aadhaar: "Aadhaar number",
  gstNumber: "GST number",
  gstin: "GST number",
  invoiceNumber: "invoice number",
  code: "code",
  key: "name",
  name: "name",
  registrationNumber: "registration number",
  chassisNumber: "chassis number",
  engineNumber: "engine number",
  _id: "ID",
};

/** "policyNumber" / "vehicle.chassis_no" -> "policy number" / "chassis no" */
export function fieldLabel(path: string): string {
  const last = String(path || "").split(".").pop() || "";
  if (FIELD_LABELS[last]) return FIELD_LABELS[last];
  return last
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .trim() || "value";
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

const GENERIC = "Something went wrong while saving. Please try again, or contact support if it keeps happening.";

/** Rewrites a raw error *string* if it looks technical; otherwise returns it as-is. */
export function humanizeErrorMessage(raw: unknown): string {
  const msg = typeof raw === "string" ? raw.trim() : raw == null ? "" : String(raw);
  if (!msg) return GENERIC;

  // ---- MongoDB duplicate key (E11000) ----
  if (/E11000|duplicate key/i.test(msg)) {
    // dup key: { mobile: "6280148814" }   or   dup key: { email: "a@b.com", tenant: 1 }
    const kv = msg.match(/dup key:\s*\{\s*([\w.]+):\s*"?([^",}]*)"?/i);
    // index: mobile_1   (fallback when the dup-key part is missing)
    const idx = msg.match(/index:\s*([\w.]+?)_-?1\b/i);
    const field = kv?.[1] || idx?.[1];
    const value = kv?.[2]?.trim();
    if (field) {
      const label = fieldLabel(field);
      return value && value !== "null"
        ? `This ${label} (${value}) is already registered to another record. Please use a different ${label}, or edit the existing record instead.`
        : `This ${label} is already registered to another record. Please use a different ${label}.`;
    }
    return "A record with these details already exists. Please check for duplicates.";
  }

  // ---- Mongoose validation: "X validation failed: phone: Path `phone` is required., email: ..." ----
  if (/validation failed/i.test(msg) || /Path `[^`]+` is required/.test(msg)) {
    const problems: string[] = [];
    const re = /Path `([^`]+)` ([^.,]+(?:\([^)]*\))?)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(msg))) {
      const label = cap(fieldLabel(m[1]));
      const rest = m[2].trim();
      if (/is required/i.test(rest)) problems.push(`${label} is required`);
      else if (/less than minimum/i.test(rest)) problems.push(`${label} is too small`);
      else if (/more than maximum/i.test(rest)) problems.push(`${label} is too large`);
      else if (/shorter than/i.test(rest)) problems.push(`${label} is too short`);
      else if (/longer than/i.test(rest)) problems.push(`${label} is too long`);
      else if (/is invalid/i.test(rest)) problems.push(`${label} is not valid`);
      else problems.push(`${label} is not valid`);
    }
    // enum: "`Foo` is not a valid enum value for path `status`."
    const enumRe = /`([^`]*)` is not a valid enum value for path `([^`]+)`/g;
    while ((m = enumRe.exec(msg))) problems.push(`"${m[1]}" is not an allowed ${fieldLabel(m[2])}`);
    // cast inside validation: "Cast to Number failed for value "abc" (type string) at path "premium""
    const castRe = /Cast to (\w+) failed for value "?([^"]*)"? .*?at path "([^"]+)"/g;
    while ((m = castRe.exec(msg))) problems.push(castSentence(m[1], m[2], m[3]));
    const uniq = Array.from(new Set(problems));
    if (uniq.length) return `Please fix the following: ${uniq.join("; ")}.`;
    return "Some details are missing or not valid. Please check the form and try again.";
  }

  // ---- Mongoose CastError ----
  const cast = msg.match(/Cast to (\w+) failed for value "?([^"]*)"? .*?at path "([^"]+)"/i);
  if (cast) return castSentence(cast[1], cast[2], cast[3]) + ".";

  // ---- Connectivity / infrastructure ----
  if (/ECONNREFUSED|ENOTFOUND|ETIMEDOUT|ECONNRESET|buffering timed out|MongoNetworkError|MongoServerSelectionError|server selection timed out|topology was destroyed/i.test(msg)) {
    return "The server couldn't reach the database just now. Please try again in a moment.";
  }
  if (/Failed to fetch|NetworkError|Network Error|Load failed/i.test(msg)) {
    return "Couldn't connect to the server. Please check your internet connection and try again.";
  }
  if (/timeout of \d+ms exceeded|timed out/i.test(msg)) {
    return "The request took too long. Please try again.";
  }
  if (/request entity too large|body exceeded|payload too large|413/i.test(msg)) {
    return "The uploaded file is too large. Please upload a smaller file.";
  }
  if (/Request failed with status code 401|jwt expired|invalid token|jwt malformed|Not authorized|Unauthorized/i.test(msg)) {
    return "Your session has expired. Please log in again.";
  }
  if (/Request failed with status code 403|Forbidden/i.test(msg)) {
    return "You don't have permission to do this.";
  }
  if (/Request failed with status code 404/i.test(msg)) {
    return "The requested record could not be found. It may have been deleted.";
  }
  if (/Request failed with status code 5\d\d/i.test(msg)) {
    return GENERIC;
  }

  // ---- Code crashes / internal details that mean nothing to a user ----
  if (
    /Cannot read propert|Cannot set propert|is not a function|is not defined|is not iterable|Unexpected token|Unexpected end of JSON|JSON\.parse|undefined is not|null is not|Maximum call stack|MongoServerError|MongoError|Plan executor error|findAndModify|E\d{5}\b/i.test(msg)
  ) {
    return GENERIC;
  }

  return msg;
}

function castSentence(type: string, value: string, path: string) {
  const label = fieldLabel(path);
  if (/ObjectId/i.test(type) || path === "_id") return `The selected record is not valid (it may have been deleted). Please refresh and try again`;
  if (/Number/i.test(type)) return `${cap(label)} must be a number${value ? ` (got "${value}")` : ""}`;
  if (/Date/i.test(type)) return `${cap(label)} must be a valid date${value ? ` (got "${value}")` : ""}`;
  if (/Boolean/i.test(type)) return `${cap(label)} must be yes or no`;
  return `${cap(label)} is not valid${value ? ` ("${value}")` : ""}`;
}

/** Friendly message for any thrown value (Error, MongoServerError, axios error, string). */
export function friendlyMessage(err: unknown): string {
  const e: any = err;
  // Structured duplicate-key info is more reliable than parsing the text.
  if (e && (e.code === 11000 || e.code === 11001) && e.keyValue && typeof e.keyValue === "object") {
    const [field, value] = Object.entries(e.keyValue)[0] || [];
    if (field) {
      const label = fieldLabel(field);
      return value !== undefined && value !== null && value !== ""
        ? `This ${label} (${value}) is already registered to another record. Please use a different ${label}, or edit the existing record instead.`
        : `This ${label} is already registered to another record. Please use a different ${label}.`;
    }
  }
  // Mongoose ValidationError: walk the structured errors map.
  if (e && e.name === "ValidationError" && e.errors && typeof e.errors === "object") {
    const parts = Object.values(e.errors).map((x: any) => {
      const label = cap(fieldLabel(x.path));
      if (x.kind === "required") return `${label} is required`;
      if (x.kind === "enum") return `"${x.value}" is not an allowed ${fieldLabel(x.path)}`;
      if (x.name === "CastError") return castSentence(x.kind || "", String(x.value ?? ""), x.path);
      if (x.kind === "min") return `${label} is too small`;
      if (x.kind === "max") return `${label} is too large`;
      return `${label} is not valid`;
    });
    if (parts.length) return `Please fix the following: ${Array.from(new Set(parts)).join("; ")}.`;
  }
  if (e && e.name === "CastError" && e.path) {
    return castSentence(e.kind || "", String(e.value ?? ""), e.path) + ".";
  }
  // axios: prefer the server's own message
  const serverMsg = e?.response?.data?.message || e?.response?.data?.error;
  if (typeof serverMsg === "string" && serverMsg) return humanizeErrorMessage(serverMsg);
  return humanizeErrorMessage(e?.message ?? e);
}

/** Suggested HTTP status for an error (409 for duplicates, 400 for bad input, else fallback). */
export function errorStatus(err: unknown, fallback = 500): number {
  const e: any = err;
  if (e?.code === 11000 || e?.code === 11001 || /E11000/.test(String(e?.message))) return 409;
  if (e?.name === "ValidationError" || e?.name === "CastError") return 400;
  return fallback;
}
