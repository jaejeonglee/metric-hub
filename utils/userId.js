/**
 * 사용자 식별자를 서비스 전반에서 일관되게 사용하기 위해 정규화합니다.
 * - 공백 제거
 * - 영문/숫자/하이픈만 허용
 * - 소문자 변환
 * @param {unknown} value
 * @returns {string}
 */
export function sanitizeUserId(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, "").replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
}
