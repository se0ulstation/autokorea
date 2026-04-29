# AutoKorea

해외 사이트의 국가 선택을 자동으로 **한국(Republic of Korea)**으로 채워주는 Chrome 확장.
`Korea, Republic of` / `South Korea` / `Republic of Korea` / `대한민국` / `+82` 등 표기가 흩어져 있어도
페이지 로드 시점에 자동으로 골라줍니다.

## 지원 범위

- 네이티브 `<select>` 국가 드롭다운
- 커스텀 검색형 드롭다운 (`role="combobox"`, `aria-haspopup="listbox"` 등)
- 전화번호 국가코드 위젯 (intl-tel-input, react-phone-input-2, react-phone-number-input 등)

선택이 일어나면 우하단 토스트로 알려주고, 사이트 단위로 끄거나 옵션 페이지에서 도메인을 관리할 수 있습니다.

## 설치 (개발 모드)

1. Chrome에서 `chrome://extensions` 열기
2. 우상단 **개발자 모드** 켜기
3. **압축해제된 확장 프로그램 로드** 클릭 → `autokorea/` 디렉토리 선택
4. 새 탭에서 회원가입/결제 폼이 있는 사이트로 이동

테스트 페이지는 `test-fixtures/native-select.html`을 직접 열어 확인할 수 있습니다.

## 옵션

확장 아이콘 우클릭 → **옵션** 또는 토스트의 **옵션** 링크.

- 마스터 ON/OFF 토글
- 비활성화할 도메인 목록 (한 줄에 하나, 서브도메인 자동 매칭)

## 권한

- `storage`: 설정(활성화 여부, 도메인 블랙리스트)을 `chrome.storage.sync`에 저장
- `<all_urls>`: 어떤 사이트의 폼이든 처리해야 하므로 모든 페이지에서 content script 실행

데이터는 사용자 본인의 Chrome 동기화 저장소에만 머무르며 외부로 전송되지 않습니다.

## 안전장치

- 옵션이 50개 미만이거나 국가 사전과 겹치는 항목이 5개 미만인 `<select>`는 건드리지 않음 (월/언어 select 보호).
- `North Korea` / `DPRK` / `북한` 등은 **항상** 매칭 거부.
- `Korea` 단독 라벨은 같은 select에 `North Korea`가 함께 있으면 매칭 안 함 (모호성 회피).
- 폼 자동 제출 안 함 — 채우기만 하고 사용자가 직접 제출.
- 같은 위젯은 한 번만 처리 (`WeakSet`으로 중복 트리거 방지).

## 디렉토리 구조

```
autokorea/
  manifest.json
  src/
    content/
      index.js              # 진입점
      detector.js           # 한국 매칭 사전
      observer.js           # MutationObserver + SPA 라우트 패치
      toast.js              # Shadow DOM 토스트
      handlers/
        native-select.js
        custom-dropdown.js
        phone-country.js
    options/
      options.html
      options.js
    background/
      service-worker.js
  test-fixtures/
    native-select.html      # 수동 테스트 페이지
```

## 알려진 한계

- Google Places 같은 주소 자동완성 input은 처리하지 않음.
- 가상 스크롤이 매우 공격적인 일부 콤보박스는 검색 입력으로도 KR을 못 찾을 수 있음.
- 같은 페이지에 country select가 여러 개 있고 그 중 일부만 한국 후보가 없으면 그 select는 그대로 둠.

## 테스트

```bash
bash scripts/test.sh        # detector 회귀 테스트 (Node 필요)
```

테스트는 한국 표기 변형, 북한 오탐, 다국어 라벨, 모호성 가드, 국가 목록 휴리스틱을 검증합니다.

## 배포

```bash
python3 scripts/make-icons.py    # icons/ 생성 (이미 있으면 생략)
bash scripts/package.sh          # dist/autokorea-v<버전>.zip 생성
```

자세한 절차는 [`store/PUBLISH_GUIDE.md`](store/PUBLISH_GUIDE.md) 참고. (Chrome Web Store는 개발자 등록비 $5 1회 / Edge Add-ons는 무료)

## 로드맵

- v1.1: 다국어 라벨 보강, 더 많은 phone widget 패턴
- v1.2: TypeScript + esbuild 도입
