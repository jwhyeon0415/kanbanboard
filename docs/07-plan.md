# 07. 구현 계획 (Implementation Plan)

## 전제 (확정 사항)

- **스택**: Next.js(App Router) + TypeScript + Supabase(Postgres + Realtime) + Vercel
- **인증**: Google OAuth **게이트** + 공유 보드 (비로그인 → `/login`, 로그인하면 전체 카드 공유·편집)
- **첫 목표(우선순위)**: **정적 보드 + 카드 CRUD 먼저** → 이후 드래그·실시간·Presence
- **시간 예산**: 며칠 → 마일스톤 M1~M8
- **배포**: 이 저장소(`kanbanboard`)에 통합, 이미 연결된 Vercel 프로젝트/CI-CD 재사용
  (전환 시 `vercel.json` 루트 리다이렉트 제거 + `mockups/` → `public/mockups/` 이동 + env 등록)

## 마일스톤 개요

| M | 목표 | 끝나면 보이는 것 | 예상 |
|---|---|---|---|
| **M1** | 프로젝트 셋업 + 인증 게이트 + DB 스키마 | 비로그인 접속 시 `/login`, Google 로그인하면 빈 보드 진입 | 반나절 |
| **M2** | 정적 3컬럼 보드 + 카드 조회 | 시드 카드가 To Do/Doing/Done에 반응형으로 표시 | 반나절 |
| **M3** | 카드 CRUD + 팀원 관리 | 카드 생성·수정·삭제, 담당자 지정, 새로고침 후 유지 | 하루 |
| **M4** | 드래그 앤 드롭 | 컬럼 간 이동 + 같은 컬럼 순서 변경(모바일 대체 UI) | 하루 |
| **M5** | 실시간 동기화 | 두 브라우저에서 변경이 즉시 반영(Postgres Changes) | 반나절 |
| **M6** | Presence | 커서 위치 + "편집 중" 표시 | 반나절 |
| **M7** | 테마 5종 + 차별화 장치 | 파스텔4+다크 전환, 04 문서의 성취감 장치 | 반나절 |
| **M8** | QA & 마감 | 반응형·IME·엣지케이스 통과, README/.env.example, 프로덕션 배포 검증 | 반나절 |

> **첫 목표 범위 = M1~M3** (정적 보드 + 카드 CRUD, 로그인 게이트 포함). M4 이후는 순차 확장.

---

## M1 — 프로젝트 셋업 + 인증 게이트 + DB 스키마

**할 일**
1. 저장소 루트에 `create-next-app`(App Router, TS, ESLint). `mockups/` → `public/mockups/`로 이동, `vercel.json` 루트 리다이렉트 제거.
2. `npm i @supabase/supabase-js @supabase/ssr`.
3. `src/lib/supabase/{client,server,middleware}.ts` + 루트 `middleware.ts`(비로그인 → `/login`).
4. `app/login/page.tsx`(Google 로그인 버튼) + `app/auth/callback/route.ts`(코드 교환).
5. Supabase 프로젝트: Google provider 활성화(OAuth 클라이언트 등록), `supabase/migrations`에 스키마(members, cards, enums, 트리거, publication) + **RLS: `authenticated`만 CRUD**.
6. `.env.local` / `.env.example`, Vercel에 `NEXT_PUBLIC_SUPABASE_URL`·`ANON_KEY`(production/preview/development) 등록.

**검증**
- 로그아웃 상태로 `/` 접속 → `/login`으로 리다이렉트.
- Google 로그인 완료 → `/`(빈 보드) 진입, 새로고침해도 로그인 유지.
- (자동) `middleware`가 `/login`·`/auth`는 통과시키는지 단위 확인.

## M2 — 정적 3컬럼 보드 + 카드 조회

**할 일**
1. `globals.css`에 확정 시안(`concept-themed`)의 색 토큰/리셋.
2. 서버 컴포넌트(`app/page.tsx`)에서 cards·members fetch → `Board`로 전달.
3. `Board`/`Column`/`Card` 컴포넌트: 컬럼별 카드 배치, 카드에 담당자·마감·우선순위 표시, 컬럼 헤더 카운트.
4. `supabase/seed.sql`로 샘플 팀원·카드 주입.

**검증**
- 시드 카드가 status별 컬럼에 정확히 표시.
- 데스크톱 3컬럼 가로 / 모바일 세로 스택 반응형 확인.

## M3 — 카드 CRUD + 팀원 관리

**할 일**
1. `lib/supabase/queries.ts`: 카드 create/update/delete, 멤버 add/delete.
2. `store/boardReducer.ts` + `BoardContext.tsx`: 낙관적 업데이트(실패 시 롤백).
3. `AddCard`(즉시 생성), `CardModal`(제목·메모·담당자·마감·우선순위·상태변경·삭제).
4. `MemberBar`: 팀원 추가/삭제 + "나" 선택(로컬 저장).

**검증**
- 카드 생성/수정/삭제가 DB에 반영되고 새로고침 후 유지.
- 필수값(제목) 빈 입력 방지, 한글 IME 조합 중 입력 손실 없음.
- 저장 실패 시 토스트 + 롤백(화면 안 깨짐).

---

## M4~M8 (첫 목표 이후 — 요약)

- **M4 드래그**: 네이티브 HTML5 DnD, `position` 중간값 재배열, 모바일은 CardModal 상태 변경으로 대체.
- **M5 실시간**: `useCards` 구독(Postgres Changes), 자기 변경 `id`/`updated_at` 병합·중복 무시, 재연결 시 재fetch.
- **M6 Presence**: `board-presence` 채널, `{memberId,name,color,cursor,editingCardId}` track → `PresenceLayer`.
- **M7 테마·차별화**: 5테마 스와치 + `data-theme`(localStorage), 04 문서 성취감 장치 선별 반영.
- **M8 QA·마감**: build/lint/vitest, 페르소나 시나리오 재현, 반응형·엣지케이스, README·`.env.example`, `curl` 프로덕션 200 + 실제 로그인/카드 저장 확인.

---

## 스코프 축소 (예산 부족 시 v2로 미룸)

| 항목 | 우선순위 | 미룰 경우 |
|---|---|---|
| 로그인 게이트 + 카드 CRUD (M1~M3) | **필수** | 미루지 않음 |
| 드래그 앤 드롭 (M4) | 높음 | CardModal 상태 변경으로만 이동(드래그 생략) |
| 실시간 동기화 (M5) | 높음 | 수동 새로고침으로 갱신 |
| Presence 커서/편집중 (M6) | 중간 | v2 |
| 테마 5종 (M7) | 중간 | 기본 테마 A 1종만 |
| 차별화 장치 (M7) | 낮음 | v2 |

## 완료 기준 (전체)

01 문서의 Definition of Done 전체 + "비로그인 → `/login` 리다이렉트, 로그인 후 전체 카드 열람/편집"이 프로덕션 URL에서 실증될 것.
