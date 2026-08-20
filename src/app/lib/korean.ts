/**
 * 한국어 조사(이/가, 을/를, 은/는, 와/과, (으)로 …)를 앞말에 맞춰 골라 줍니다.
 *
 * 화면에 사람 이름·유치원 이름처럼 값이 정해지지 않은 말이 들어가면 뒤에 붙는 조사가
 * 달라집니다. 그동안은 `이(가)`, `을(를)`, `(으)로`처럼 두 형태를 나란히 적어
 * 넘겼는데, 그건 "우리가 못 고른다"는 사정을 사용자에게 떠넘기는 표기입니다.
 * 반대로 한쪽만 박아 두면(`${child}와의 연결`) 받침 있는 이름에서 틀립니다.
 * 그래서 앞말의 마지막 글자를 보고 실제로 고릅니다.
 *
 * 판정 기준은 **소리**입니다. 그래서 한글뿐 아니라 숫자와 영문도 읽는 소리를 기준으로
 * 봅니다(3 → "삼"이라 받침 있음, 2 → "이"라 없음). 영문은 한 글자씩 읽는 관행을
 * 따르므로 약어(PC, ID)에는 맞지만 통으로 읽는 단어(Tom)에는 어긋날 수 있습니다.
 * 판단할 수 없는 글자(기호·이모지 등)는 받침 없음으로 봅니다 — 어차피 한쪽을 골라야
 * 하고, 그쪽이 덜 어색하게 읽히는 편입니다.
 */

const HANGUL_BASE = 0xac00;
const HANGUL_LAST = 0xd7a3;
const JONGSEONG_COUNT = 28;

/** 숫자를 한국어로 읽었을 때의 종성. 0 → 영(ㅇ), 1 → 일(ㄹ) … */
const DIGIT_FINAL: Record<string, string | null> = {
  "0": "ㅇ",
  "1": "ㄹ",
  "2": null,
  "3": "ㅁ",
  "4": null,
  "5": null,
  "6": "ㄱ",
  "7": "ㄹ",
  "8": "ㄹ",
  "9": null,
};

/** 알파벳을 한 글자씩 읽었을 때의 종성. 엘(ㄹ)·엠(ㅁ)·엔(ㄴ)·알(ㄹ)·제트(없음) … */
const LATIN_FINAL: Record<string, string | null> = {
  l: "ㄹ",
  m: "ㅁ",
  n: "ㄴ",
  r: "ㄹ",
};

/**
 * 앞말의 마지막 소리가 가진 종성(받침)을 돌려줍니다. 받침이 없으면 `null`입니다.
 *
 * `ㄹ` 받침만 따로 알아야 하는 조사가 있어서(“(으)로”) 있고/없고가 아니라
 * 어떤 받침인지까지 돌려줍니다.
 */
export function finalConsonant(word: string): string | null {
  const trimmed = word.trim();
  if (!trimmed) return null;

  const last = trimmed[trimmed.length - 1];
  const code = last.charCodeAt(0);

  if (code >= HANGUL_BASE && code <= HANGUL_LAST) {
    const index = (code - HANGUL_BASE) % JONGSEONG_COUNT;
    if (index === 0) return null;
    // ㄹ만 구분하면 되므로 나머지는 "받침 있음"을 뜻하는 대표값으로 묶습니다.
    return index === 8 ? "ㄹ" : "ㄱ";
  }

  if (last >= "0" && last <= "9") return DIGIT_FINAL[last];

  const lower = last.toLowerCase();
  if (lower >= "a" && lower <= "z") return LATIN_FINAL[lower] ?? null;

  return null;
}

/** 앞말에 받침이 있는지. */
export function hasFinalConsonant(word: string): boolean {
  return finalConsonant(word) !== null;
}

/** 조사 짝. 앞이 받침 있을 때 쓰는 형태, 뒤가 받침 없을 때 쓰는 형태입니다. */
export type JosaKind = "이/가" | "을/를" | "은/는" | "과/와" | "으로/로" | "아/야" | "이랑/랑" | "으로서/로서" | "으로써/로써";

const PAIRS: Record<JosaKind, [withFinal: string, withoutFinal: string]> = {
  "이/가": ["이", "가"],
  "을/를": ["을", "를"],
  "은/는": ["은", "는"],
  "과/와": ["과", "와"],
  "으로/로": ["으로", "로"],
  "아/야": ["아", "야"],
  "이랑/랑": ["이랑", "랑"],
  "으로서/로서": ["으로서", "로서"],
  "으로써/로써": ["으로써", "로써"],
};

/** “으로” 계열은 ㄹ 받침을 받침 없는 것처럼 취급합니다(서울로, 연필로). */
const EULO_LIKE = new Set<JosaKind>(["으로/로", "으로서/로서", "으로써/로써"]);

/**
 * 앞말에 맞는 조사 **하나**를 고릅니다. 앞말은 붙이지 않습니다.
 *
 * @example josa("민준", "이/가") // "이"
 * @example josa("서울", "으로/로") // "로" — ㄹ 받침
 */
export function josa(word: string, kind: JosaKind): string {
  const [withFinal, withoutFinal] = PAIRS[kind];
  const final = finalConsonant(word);
  if (final === null) return withoutFinal;
  if (final === "ㄹ" && EULO_LIKE.has(kind)) return withoutFinal;
  return withFinal;
}

/**
 * 앞말과 조사를 붙여 돌려줍니다. 화면에서 가장 자주 쓰는 형태입니다.
 *
 * @example withJosa("민준", "이/가") // "민준이"
 */
export function withJosa(word: string, kind: JosaKind): string {
  return `${word}${josa(word, kind)}`;
}
