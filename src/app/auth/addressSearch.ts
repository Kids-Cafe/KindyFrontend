/**
 * 다음(카카오) 우편번호 서비스 연동입니다. API 키가 필요 없는 무료 스크립트라
 * 실행 시점에 동적으로 로드한 뒤 팝업을 띄우고 결과를 Promise로 돌려줍니다.
 */

const SCRIPT_SRC = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: { oncomplete: (data: DaumPostcodeResult) => void }) => { open: () => void };
    };
  }
}

interface DaumPostcodeResult {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
}

export interface AddressSearchResult {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
}

let scriptLoadPromise: Promise<void> | null = null;

function loadDaumPostcodeScript(): Promise<void> {
  if (window.daum?.Postcode) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error("우편번호 서비스를 불러오지 못했어요."));
    };
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

/** 우편번호 검색 팝업을 열고, 사용자가 주소를 선택하면 결과를 반환합니다. */
export async function openAddressSearch(): Promise<AddressSearchResult> {
  await loadDaumPostcodeScript();
  if (!window.daum?.Postcode) {
    throw new Error("우편번호 서비스를 사용할 수 없어요.");
  }

  return new Promise((resolve) => {
    new window.daum!.Postcode({
      oncomplete: (data) => {
        resolve({
          zonecode: data.zonecode,
          roadAddress: data.roadAddress,
          jibunAddress: data.jibunAddress,
        });
      },
    }).open();
  });
}
