/**
 * 회원가입 폼에서 쓰는 클라이언트 측 검증 함수 모음입니다.
 * 백엔드가 없는 지금은 이 규칙이 유일한 검증 계층입니다.
 */

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** 8자 이상 + 영문/숫자/특수문자 중 2종류 이상 조합 */
export function isPasswordValid(password: string): boolean {
  if (password.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return [hasLetter, hasDigit, hasSpecial].filter(Boolean).length >= 2;
}

/** 010-1234-5678 형식. 하이픈 유무 모두 허용합니다. */
export function isValidPhone(phone: string): boolean {
  return /^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.trim());
}

/** 사업자등록번호 000-00-00000 형식. 하이픈 유무 모두 허용합니다. */
export function isValidBusinessRegNo(no: string): boolean {
  return /^\d{3}-?\d{2}-?\d{5}$/.test(no.trim());
}

/** 아동 계정의 아이디. 이메일 형식이 아니어도 되는 대신 4자 이상의 영문/숫자 조합만 허용합니다. */
export function isValidLoginId(id: string): boolean {
  return /^[A-Za-z0-9_-]{4,20}$/.test(id.trim());
}

/** YYYY-MM-DD 형식이면서 실제로 존재하는 날짜인지 확인합니다. */
export function isValidBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === value;
}

/** 목업 인증번호. 6자리 숫자면 통과시킵니다. */
export function isMockVerificationCodeValid(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}
