/**
 * Sanitize a username
 * @param {unknown} value
 * @returns {string}
 */
export function sanitizeUserName(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();
}
