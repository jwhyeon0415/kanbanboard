# 06. 아키텍처 (Architecture)

## 스택 확정

| 레이어 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **Next.js (App Router) + TypeScript** | 배포(Vercel) 일체화, 서버/클라이언트 컴포넌트 분리, env·라우팅 기본 제공 |
| 백엔드/DB | **Supabase (Postgres + Realtime)** | 관리형 Postgres + 실시간 구독/Presence를 한 번에. 별도 서버 불필요 |
| 실시간 | **Supabase Realtime** — Postgres Changes 구독 **+ Presence(커서/편집중)** | 변경 즉시 동기화 + 협업 인지 |
| 드래그 | **네이티브 HTML5 Drag & Drop** (+ 모바일 대체: 편집에서 상태 변경) | 의존성 없음. 모바일은 대체 수단으로 커버 |
| 상태 관리 | **React 내장** (useReducer + Context) + Supabase 구독 동기화 | 단일 보드 규모에 충분, 의존성 최소 |
| 인증 | **Google OAuth 게이트** (`@supabase/ssr`) + 공유 보드 | 로그인해야 진입(비로그인 → `/login`). 보드는 공유, 사용자별 권한은 추후 |
| 테스트 | **Vitest + React Testing Library** | Next.js/TS 궁합, 빠름 |
| 배포 | **Vercel** | Next.js 표준 배포, 프리뷰 배포 |

### 비채택 & 이유
- **@dnd-kit / 라이브러리 DnD** — 사용자 요청대로 네이티브 HTML5 DnD 채택(모바일은 대체 UI로 처리).
- **Zustand/Redux** — 단일 보드 상태엔 과함. 내장 상태 + 구독으로 충분.
- **사용자별 소유권 RLS(지금)** — 공유 보드라 카드는 members 기반(`assignee_id`). Google 로그인은 접근 게이트로만, 사용자별 카드 소유 분리는 추후.
- **localStorage 저장** — 실시간 협업 요구로 원격 DB(Supabase)로 전환. (테마 선택 값만 localStorage 유지)

## 폴더 구조

```
kanbanboard/
├─ docs/                      # 기획 문서 (01~07)
├─ mockups/                   # 디자인 시안 (concept-themed.html = 확정 프로토타입)
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx           # 루트 레이아웃, ThemeProvider, 전역 스타일
│  │  ├─ page.tsx             # 보드 페이지 (서버: 초기 데이터 fetch → 클라이언트로)
│  │  ├─ login/page.tsx       # Google 로그인 (비로그인 랜딩)
│  │  ├─ auth/callback/route.ts # OAuth 코드 교환 → 세션 쿠키
│  │  └─ globals.css          # CSS 토큰(5테마) + 리셋
│  ├─ components/
│  │  ├─ board/
│  │  │  ├─ Board.tsx         # 3컬럼 컨테이너, DnD 오케스트레이션
│  │  │  ├─ Column.tsx        # 컬럼(헤더 카운트/WIP, 드롭 타깃)
│  │  │  ├─ Card.tsx          # 카드 요약(담당자·마감·우선순위), draggable
│  │  │  ├─ CardModal.tsx     # 상세 편집(제목·메모·담당자·마감·우선순위·삭제·상태변경)
│  │  │  ├─ AddCard.tsx       # 컬럼 하단 즉시 생성
│  │  │  └─ PresenceLayer.tsx # 커서/편집중 오버레이
│  │  ├─ toolbar/
│  │  │  ├─ Toolbar.tsx       # 제목·진척바·스트릭·아바타 스택
│  │  │  ├─ FilterSort.tsx    # 필터 칩 + 정렬 셀렉트
│  │  │  └─ MemberBar.tsx     # 팀원 목록 + "나" 선택
│  │  ├─ ThemePicker.tsx      # 5테마 스와치
│  │  └─ ui/                  # 아바타, 칩, pill 등 공용
│  ├─ lib/
│  │  ├─ supabase/
│  │  │  ├─ client.ts         # 브라우저 클라이언트 (anon key)
│  │  │  ├─ server.ts         # 서버 컴포넌트용 클라이언트
│  │  │  ├─ middleware.ts     # 세션 갱신 + 비로그인 → /login 리다이렉트
│  │  │  └─ queries.ts        # CRUD 쿼리 함수
│  │  ├─ realtime/
│  │  │  ├─ useCards.ts       # 카드 구독(Postgres Changes) 훅
│  │  │  └─ usePresence.ts    # 커서/편집중 Presence 훅
│  │  ├─ store/
│  │  │  ├─ boardReducer.ts   # 카드 목록 reducer (낙관적 업데이트)
│  │  │  └─ BoardContext.tsx  # Context + provider
│  │  ├─ theme.ts             # 테마 목록·기본값·localStorage
│  │  └─ types.ts             # 공용 타입
│  └─ utils/                  # 정렬·필터·position 계산
├─ supabase/
│  ├─ migrations/             # SQL 스키마·RLS
│  └─ seed.sql                # 초기 팀원·샘플 카드
│  └─ middleware.ts           # (src 안) 미들웨어 (lib/supabase/middleware 호출, 비로그인 → /login)
├─ .env.local                 # NEXT_PUBLIC_SUPABASE_URL / ANON_KEY (커밋 금지)
├─ .env.example
└─ tests/                     # Vitest
```

## 데이터 스키마 (Supabase Postgres)

```sql
-- 팀원 (인증 없음: 접속 시 여기서 "나"를 선택)
create table members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text not null,           -- 예: #4C6EF5
  initial    text not null,           -- 예: 지
  created_at timestamptz not null default now()
);

-- 카드 (컬럼은 status enum으로 고정 — 별도 컬럼 테이블 없음)
create type card_status   as enum ('todo','doing','done');
create type card_priority as enum ('low','medium','high');

create table cards (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  assignee_id uuid references members(id) on delete set null,  -- null = 미배정
  due_date    date,
  priority    card_priority not null default 'medium',
  status      card_status   not null default 'todo',
  position    double precision not null default 0,  -- 같은 status 내 정렬 키
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index cards_status_position_idx on cards (status, position);

-- updated_at 자동 갱신
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
create trigger cards_updated_at before update on cards
  for each row execute function set_updated_at();

-- Realtime 발행 대상에 추가
alter publication supabase_realtime add table cards;
alter publication supabase_realtime add table members;
```

### 정렬(position) 전략
- 같은 `status` 안에서 `position` 오름차순 정렬.
- 카드 이동/재정렬 시 **앞뒤 카드 position의 중간값**을 부여(예: (prev+next)/2). 신규는 맨 뒤 = max+1.
- 값이 너무 촘촘해지면(희귀) 해당 컬럼을 1..N으로 재배열(normalize).

## 타입 (src/lib/types.ts)

```ts
export type CardStatus = 'todo' | 'doing' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export interface Member {
  id: string;
  name: string;
  color: string;   // hex
  initial: string;
}

export interface Card {
  id: string;
  title: string;
  description: string | null;
  assigneeId: string | null;   // null = 미배정
  dueDate: string | null;      // 'YYYY-MM-DD'
  priority: Priority;
  status: CardStatus;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export type ThemeKey = 'a' | 'b' | 'c' | 'd' | 'dark';
```

## 상태 흐름

```
[사용자 A 브라우저]                         [Supabase]                      [사용자 B 브라우저]
  UI 액션(카드 이동)                         Postgres                         UI
     │ 낙관적 업데이트(dispatch)                │                                │
     ├────────► BoardReducer(즉시 반영)         │                                │
     │                                          │                                │
     └── update cards ──────────────────────►  cards 테이블                      │
                                                │  변경 발생                      │
                                    Postgres Changes 브로드캐스트 ───────────────► useCards 구독
                                                │                          reducer 반영(화면 갱신)
   useCards 구독 ◄────────────────────────────┘                                │
   (자기 변경은 id로 중복 무시)

Presence 채널(커서/편집중):  A track({cursor, editingCardId}) ⇄ Supabase ⇄ B 수신 → PresenceLayer 렌더
```

- **낙관적 업데이트**: 로컬 reducer를 먼저 갱신 → Supabase 반영 → 구독 이벤트로 정합성 확인(실패 시 롤백).
- **구독 중복 처리**: 내가 만든 변경이 구독으로 되돌아오면 카드 `id`/`updated_at`로 병합·무시.
- **테마**: 서버 데이터와 무관. `theme.ts`가 localStorage에서 읽어 `data-theme` 적용(기본 `a`).

## 실시간 상세

- **Postgres Changes**: `cards`(insert/update/delete), `members`(insert/delete) 구독 → reducer 반영.
- **Presence**: 별도 Realtime 채널(`board-presence`). 각 클라이언트가 `{ memberId, name, color, cursor:{x,y}, editingCardId }`를 track. 수신측은 커서 오버레이 + 편집 중 카드에 표시(예: 카드 테두리에 해당 색).

## 보안 / 환경

- **환경변수**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (`.env.local`, 커밋 금지). service_role 키는 클라이언트에 절대 노출 금지.
- **인증 게이트**: Google OAuth(`signInWithOAuth`) → `/auth/callback`에서 코드 교환. 미들웨어가 매 요청 세션을 검증(`getUser()`)하고, 비로그인 요청은 `/login`으로 리다이렉트(`/login`·`/auth`는 예외).
- **RLS**: 모든 테이블 `enable row level security`. 로그인 게이트를 쓰므로 **`authenticated` 역할에만 select/insert/update/delete 허용**(anon은 전면 차단). 로그인한 사용자끼리는 공유 보드라 전체 카드 CRUD 가능. ⚠ 로그인한 누구나 남의 카드도 편집 가능(공유 전제) — 사용자별 소유권 제한은 추후 개선. `getSession()` 대신 서버에선 반드시 `getUser()` 사용(토큰 위조 방지).
- **Vercel**: 프로젝트에 동일 env 등록. main 브랜치 → 프로덕션, PR → 프리뷰 배포.

## 성능·안정성

- 초기 로드: 서버 컴포넌트에서 카드/멤버 fetch → 클라이언트 하이드레이션.
- 드래그 위치 계산은 O(1)(중간값). 재정렬 normalize는 드물게.
- 구독 실패/네트워크 끊김 시 재연결 + 최신 상태 재fetch.
- 저장 실패 시 토스트로 알리고 낙관적 변경 롤백(빈 화면으로 깨지지 않게).
