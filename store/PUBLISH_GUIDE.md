# Chrome Web Store 배포 가이드

## 비용
**Chrome Web Store 자체는 무료지만, 개발자 계정 등록비 $5 (1회, 평생)** 가 있습니다.
이 비용으로 무제한 확장 게시 가능. (Edge Add-ons는 완전 무료지만 사용자 수가 훨씬 적음)

---

## 1. 개발자 계정 만들기 (최초 1회)

1. https://chrome.google.com/webstore/devconsole/ 접속
2. Google 계정 로그인
3. 약관 동의
4. **$5 결제** (신용카드/Google Pay)
5. 본인 인증 (전화번호)

---

## 2. 업로드

```bash
# 패키징
bash scripts/package.sh
# → dist/autokorea-v1.0.0.zip 생성됨
```

1. 개발자 콘솔 → **새 항목** 클릭
2. `dist/autokorea-v1.0.0.zip` 업로드

---

## 3. 스토어 등록 정보 입력

`store/STORE_LISTING.md` 의 내용을 그대로 복사해 넣으면 됩니다.

| 필드 | 값 |
|---|---|
| 짧은 설명 | STORE_LISTING.md의 "짧은 설명" 블록 |
| 상세 설명 | STORE_LISTING.md의 "상세 설명" 블록 |
| 카테고리 | Productivity |
| 언어 | 한국어 |

### 스크린샷 (필수, 최소 1장)
- 1280×800 또는 640×400 PNG
- 만드는 법: `test-fixtures/native-select.html` 열고 Cmd+Shift+4로 캡처
  - 토스트가 뜬 순간 / 옵션 페이지 / 비포·애프터 비교

### 아이콘
- 이미 `icons/128.png`이 zip에 포함됨 — 자동 사용

### 프로모션 타일 (선택)
- 작은 타일 440×280 PNG: 있으면 검색 결과에서 더 눈에 띔

---

## 4. 개인정보 / 권한 사유 입력

스토어 콘솔의 **개인정보 보호 관행** 탭:

1. **단일 목적**: STORE_LISTING.md의 "단일 목적 진술" 블록 복사
2. **권한 사유**: STORE_LISTING.md의 "권한 사유" 블록의 두 항목 각각 복사
3. **데이터 사용 공시**: 모두 ☐ (수집 없음)
4. **인증 항목 3개**: 모두 ☑ 체크
5. **개인정보처리방침 URL**: 
   - 옵션 A) GitHub Pages에 `store/PRIVACY.md` 호스팅 → 그 URL
   - 옵션 B) Notion/티스토리 등에 공개 페이지로 올리고 URL 입력
   - **반드시 공개적으로 접근 가능한 URL이어야 함**

---

## 5. 심사 제출

- **검토 대기 시간**: 보통 1~3일, 길면 1~2주
- 거절 사유 1순위: 권한 사유 부실, 개인정보처리방침 URL 누락
- 위 가이드대로 입력하면 통과 가능성 높음

---

## 거절 받았을 때

- 거절 메일에 사유가 명시됨 (예: "Permission justification insufficient")
- STORE_LISTING.md의 권한 사유를 더 구체적으로 보강해서 재제출
- 일반적으로 재심사도 며칠 소요

---

## 무료 대안 — Edge Add-ons

같은 zip을 https://partner.microsoft.com/en-us/dashboard/microsoftedge/ 에 업로드 가능. **개발자 등록비 무료**. 심사도 빠른 편 (1~3일). MV3 호환되므로 코드 수정 없이 그대로 동작.

---

## 무료 대안 — 자체 호스팅

Chrome Web Store 없이도 사용 가능:
1. `dist/autokorea-v1.0.0.zip`을 GitHub Releases에 업로드
2. 사용자에게 안내: "압축 해제 후 chrome://extensions → 개발자 모드 → 압축해제된 확장 프로그램 로드"
3. 단점: Chrome이 시작 시마다 "개발자 모드 확장 프로그램 사용 중지" 경고 표시

---

## 업데이트 시

1. `manifest.json`의 `version`을 올림 (1.0.0 → 1.0.1)
2. `bash scripts/package.sh`
3. 콘솔 → 패키지 탭에서 새 zip 업로드 → 검토 제출
4. 동일한 1~3일 심사 후 자동으로 사용자에게 배포
