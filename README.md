# @clroot/react-kakao-postcode

[![npm version](https://img.shields.io/npm/v/@clroot/react-kakao-postcode)](https://www.npmjs.com/package/@clroot/react-kakao-postcode)

카카오 우편번호 서비스를 위한 React 라이브러리입니다. [react-daum-postcode](https://github.com/kmsbernard/react-daum-postcode)에 영감을 받아, 카카오 우편번호 서비스의 [도메인 및 네임스페이스 변경](https://github.com/daumPostcode/QnA/issues/1498)에 대응하여 headless hook 기반의 새로운 구조로 재설계하였습니다.

## 설치

```bash
bun add @clroot/react-kakao-postcode
# npm install @clroot/react-kakao-postcode
# pnpm add @clroot/react-kakao-postcode
```

React 16.8 이상이 필요합니다.

## 사용법

### 1. Headless Hook

`useKakaoPostcode`는 모든 로직을 담당하는 핵심 hook입니다. UI는 직접 구성합니다.

```tsx
import { useKakaoPostcode } from '@clroot/react-kakao-postcode';

function AddressSearch() {
  const { status, error, embedRef, open } = useKakaoPostcode({
    onComplete: (address) => {
      // address.zonecode, address.roadAddress 등 사용
      console.log(address.zonecode, address.roadAddress);
    },
  });

  if (status === 'error') return <p>{error?.message}</p>;

  return (
    <div>
      {/* embed 모드: ref를 연결하면 해당 영역에 검색창이 표시됩니다 */}
      <div ref={embedRef} style={{ width: '100%', height: 400 }} />

      {/* popup 모드: open()을 호출하면 팝업으로 열립니다 */}
      <button onClick={() => open()}>팝업으로 열기</button>
    </div>
  );
}
```

#### Hook Options

| 이름 | 타입 | 기본값 | 설명 |
|:-----|:-----|:-------|:-----|
| onComplete | `(address: Address) => void` | - | 주소 선택 완료 시 호출 |
| onClose | `(state: CloseState) => void` | - | 서비스 닫힘 시 호출 |
| onSearch | `(data: SearchData) => void` | - | 검색 실행 시 호출 |
| onResize | `(size: Size) => void` | - | 화면 크기 변경 시 호출 |
| onError | `(error: Error) => void` | - | 스크립트 로드 실패 시 호출 |
| defaultQuery | `string` | `''` | 검색창 초기 검색어 |
| autoClose | `boolean` | `true` | 주소 선택 후 자동 닫힘 |
| scriptUrl | `string` | 카카오 CDN | 커스텀 스크립트 URL |
| timeout | `number` | `10000` | 스크립트 로드 타임아웃 (ms) |
| maxRetries | `number` | `2` | 로드 실패 시 재시도 횟수 |
| theme | `Theme` | - | 검색창 테마 커스터마이징 |

#### Hook 반환값

| 이름 | 타입 | 설명 |
|:-----|:-----|:-----|
| status | `'idle' \| 'loading' \| 'ready' \| 'error'` | 현재 상태 |
| error | `Error \| null` | 에러 객체 |
| embedRef | `(el: HTMLElement \| null) => void` | embed 모드용 콜백 ref |
| open | `(options?: OpenOptions) => void` | popup 모드로 열기 |
| close | `() => void` | 수동 닫기 |

### 2. Embed 컴포넌트

검색창을 페이지에 바로 표시합니다.

```tsx
import { Postcode } from '@clroot/react-kakao-postcode';

function AddressForm() {
  return (
    <Postcode
      onComplete={(address) => console.log(address)}
      style={{ height: 500 }}
    />
  );
}
```

#### Props

`useKakaoPostcode`의 모든 옵션에 더해 다음을 지원합니다.

| 이름 | 타입 | 기본값 | 설명 |
|:-----|:-----|:-------|:-----|
| className | `string` | - | 래퍼 요소 CSS 클래스 |
| style | `CSSProperties` | `{ width: '100%', height: 400 }` | 래퍼 요소 스타일 |

### 3. Popup 컴포넌트

children을 클릭하면 팝업으로 검색창이 열립니다.

```tsx
import { PostcodePopup } from '@clroot/react-kakao-postcode';

function AddressButton() {
  return (
    <PostcodePopup onComplete={(address) => console.log(address)}>
      <button>주소 검색</button>
    </PostcodePopup>
  );
}
```

children에 함수를 전달하면 상태에 따라 UI를 분기할 수 있습니다.

```tsx
<PostcodePopup onComplete={handleComplete}>
  {({ open, status }) => (
    <button onClick={open} disabled={status === 'loading'}>
      {status === 'loading' ? '불러오는 중...' : '주소 검색'}
    </button>
  )}
</PostcodePopup>
```

#### Props

`useKakaoPostcode`의 모든 옵션에 더해 다음을 지원합니다.

| 이름 | 타입 | 설명 |
|:-----|:-----|:-----|
| openOptions | `OpenOptions` | 팝업 위치·제목 등 설정 |
| children | `ReactNode \| (api) => ReactNode` | 트리거 요소 또는 render function |

**OpenOptions:**

| 이름 | 타입 | 설명 |
|:-----|:-----|:-----|
| q | `string` | 검색어 |
| left | `number \| string` | 팝업 X 좌표 |
| top | `number \| string` | 팝업 Y 좌표 |
| autoClose | `boolean` | 주소 선택 후 자동 닫힘 |
| popupTitle | `string` | 팝업 타이틀 |
| popupKey | `string` | 팝업 키 (동일 키 시 같은 창 재사용) |

## 주소 데이터 구조

`onComplete` 콜백으로 전달되는 `Address` 객체의 주요 필드입니다.

| 필드 | 타입 | 설명 |
|:-----|:-----|:-----|
| zonecode | `string` | 우편번호 |
| address | `string` | 기본 주소 |
| addressEnglish | `string` | 기본 주소 (영문) |
| addressType | `'R' \| 'J'` | `R`: 도로명, `J`: 지번 |
| roadAddress | `string` | 도로명 주소 |
| jibunAddress | `string` | 지번 주소 |
| buildingName | `string` | 건물명 |
| apartment | `'Y' \| 'N'` | 공동주택 여부 |
| sido | `string` | 시/도 |
| sigungu | `string` | 시/군/구 |
| bname | `string` | 법정동/법정리 |
| query | `string` | 사용자 검색어 |

전체 필드는 [카카오 우편번호 서비스 가이드](https://postcode.map.kakao.com/guide)를 참고하세요.

## 고급: 스크립트 로더 직접 사용

React 없이 스크립트 로딩만 필요한 경우 `createPostcodeLoader`를 사용할 수 있습니다.

```typescript
import { createPostcodeLoader } from '@clroot/react-kakao-postcode';

const loader = createPostcodeLoader({
  timeout: 5000,
  maxRetries: 3,
});

const Postcode = await loader.load();
const instance = new Postcode({
  oncomplete: (address) => console.log(address),
});
instance.open();
```

## react-daum-postcode에서 마이그레이션

| react-daum-postcode | @clroot/react-kakao-postcode |
|:---|:---|
| `<DaumPostcodeEmbed onComplete={fn} />` | `<Postcode onComplete={fn} />` |
| `const open = useDaumPostcodePopup()` | `const { open } = useKakaoPostcode({ onComplete: fn })` |
| `open({ onComplete: fn })` | `open()` (onComplete는 hook에 전달) |
| 에러 시 `errorMessage` prop | `status === 'error'`로 직접 처리 |
| 스크립트 URL만 커스터마이징 | timeout, retry, 커스텀 로더까지 지원 |

## 참고

이 패키지는 카카오 우편번호 서비스와 독립적으로 제작되었습니다. React 환경에서 발생하는 이슈는 이 저장소의 [이슈 트래커](https://github.com/clroot/react-kakao-postcode/issues)에 남겨주세요. 카카오 우편번호 서비스 자체의 문제는 [공식 QnA](https://github.com/daumPostcode/QnA/issues)를 참고해주세요.

## License

MIT
