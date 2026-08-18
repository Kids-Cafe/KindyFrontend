/**
 * 고유 id 생성기입니다.
 *
 * `crypto.randomUUID()`는 **보안 컨텍스트(HTTPS 또는 localhost)에서만** 정의됩니다.
 * 휴대폰에서 `http://192.168.x.x:5173` 같은 LAN 주소로 접속하거나, TLS 없는 스테이징에
 * 올리면 모든 브라우저에서 `undefined`가 되어 `TypeError`로 앱이 통째로 멈춥니다.
 * (Safari 15.3 이하, Firefox 94 이하도 마찬가지입니다.)
 *
 * 여기서 만드는 id는 화면 목록의 key와 목업 레코드 식별자로만 쓰이므로,
 * 암호학적 무작위성이 필요하지 않습니다. 쓸 수 있으면 표준 API를 쓰고,
 * 없으면 충돌하지 않을 정도의 값으로 대체합니다.
 */

export function newId(): number {
  return -Date.now() - Math.random();
}
