# Naier

Naier는 Nostr 기반 1:1 DM(Direct Message) 웹 클라이언트입니다.
백엔드 없이 프론트엔드만으로 동작하며, 키 관리/친구 관리/릴레이 관리/암호화 채팅 기능을 제공합니다.

## 1. 주요 기능

- Nostr 키 관리
- 새 키 생성(`nsec`/`npub`)
- `nsec` 가져오기
- 브라우저 저장 토글 및 현재 키 삭제
- 친구 관리
- `npub` 또는 64자 hex 공개키로 친구 추가
- QR 카메라 스캔, QR 이미지 업로드, 초대 링크(`/add/:npub`) 지원
- 친구 검색 및 삭제
- 채팅
- NIP-04 암호화 DM(kind `4`) 송수신
- 실시간 구독 + 초기 메시지 히스토리 로드
- 읽지 않음 카운트 및 마지막 읽은 시각 로컬 저장
- 이미지 URL 자동 감지/미리보기
- 프로필 관리
- Nostr 프로필(kind `0`) 조회/수정
- 릴레이 관리
- 릴레이 추가/삭제/초기화
- 릴레이 연결 상태(connected/connecting/disconnected) 표시

## 2. 기술 스택

- React 18 + TypeScript
- Vite 5
- Tailwind CSS
- nostr-tools
- jsQR, qrcode.react

## 3. 프로젝트 구조

```text
naier/
  src/
    App.tsx                      # 앱 루트/상태 조합
    components/
      chat/                      # 채팅 UI
      friend/                    # 친구 목록/추가 모달
      key/                       # 키 관리 모달
      layout/                    # 사이드바/모바일 레이아웃
      profile/                   # 프로필 패널
      relay/                     # 릴레이 패널
      ui/                        # 공통 UI 컴포넌트
    hooks/
      useKeys.ts                 # 키 생성/가져오기/저장
      useRelays.ts               # 릴레이 목록/상태
      useFriends.ts              # 친구 저장/불러오기(kind 10004)
      useChat.ts                 # DM 구독/발행(kind 4)
      useFriendPreviews.ts       # 마지막 메시지/읽지 않음
      useProfile.ts              # 프로필 조회/수정(kind 0)
    constants/relays.ts          # 기본 릴레이/스토리지 키
    lib/storage.ts               # localStorage 래퍼
    types/index.ts               # 공통 타입
```

## 4. 시작하기

### 요구 사항

- Node.js 18 이상(LTS 권장)
- npm

### 설치

```bash
cd naier
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

PowerShell 실행 정책으로 `npm` 실행이 막히면 아래처럼 실행하세요.

```powershell
npm.cmd run dev
```

기본 주소: `http://localhost:5173`

### 빌드 / 미리보기

```bash
npm run build
npm run preview
```

## 5. 사용 순서

1. Key Management에서 키를 생성하거나 `nsec`를 가져옵니다.
2. Add Friend에서 `npub`/hex/QR로 친구를 추가합니다.
3. 친구를 선택하면 DM 구독이 시작됩니다.
4. 메시지를 입력하면 NIP-04로 암호화되어 발행됩니다.
5. Relay Settings에서 릴레이를 관리하고 연결 상태를 확인합니다.

## 6. LocalStorage 키

- `naier_privkey`: 개인키(hex, 옵션)
- `naier_save_key`: 개인키 저장 여부
- `naier_friends_cache`: 친구 목록 캐시
- `naier_relays`: 릴레이 목록
- `naier_last_read`: 친구별 마지막 읽은 시각
- `naier_profile`: 내 프로필 캐시

## 7. 보안 참고

- 브라우저 저장을 끄면 개인키를 메모리에서만 사용합니다.
- 브라우저 저장을 켜면 편의성은 올라가지만 XSS 위험이 증가할 수 있습니다.
- 기존 `nsec` 백업 없이 새 키를 생성하면 이전 신원을 복구할 수 없습니다.

## 8. 기본 릴레이

- `wss://relay.damus.io`
- `wss://nos.lol`
- `wss://relay.nostr.band`

## 9. 트러블슈팅

- PowerShell에서 `npm`이 막힐 때
- `npm.cmd run dev` 사용 또는 실행 정책 조정

- 친구 추가가 실패할 때
- 입력값이 `npub1...` 또는 64자 hex 공개키인지 확인
- 키가 먼저 로드되었는지 확인
- 릴레이 연결 상태 확인
