-- 0001_init.sql — 칸반보드 초기 스키마 + RLS
-- 적용: Supabase 대시보드 SQL Editor에 붙여넣고 실행 (또는 supabase db push)
-- ⚠ 재실행 안전(idempotent): 맨 위에서 기존 객체를 먼저 제거한다.
--   데이터가 있으면 지워지므로 "초기 구축 단계" 전제. 실데이터 생긴 뒤엔 이 파일을 다시 돌리지 말 것.

-- ── 기존 객체 정리 (부분 적용/재실행 대비) ──
drop table if exists cards   cascade;
drop table if exists members cascade;
drop type  if exists card_status;
drop type  if exists card_priority;
drop function if exists set_updated_at cascade;

-- ── 팀원 (카드 담당자로 지정하는 members. 로그인은 접근 게이트로 별도) ──
create table members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text not null,           -- 예: #4C6EF5
  initial    text not null,           -- 예: 지
  created_at timestamptz not null default now()
);

-- ── 카드 (컬럼은 status enum으로 고정 — 별도 컬럼 테이블 없음) ──
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

-- ── Realtime 발행 대상에 추가 (M5 실시간 구독용, 중복 add 방지) ──
do $$
begin
  begin alter publication supabase_realtime add table cards;
  exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table members;
  exception when duplicate_object then null; end;
end $$;

-- ── RLS: 로그인(authenticated)한 사용자만 전체 CRUD, anon 전면 차단 ──
alter table members enable row level security;
alter table cards   enable row level security;

drop policy if exists "authenticated all on cards"   on cards;
drop policy if exists "authenticated all on members" on members;

create policy "authenticated all on cards"
  on cards   for all
  to authenticated
  using (true) with check (true);

create policy "authenticated all on members"
  on members for all
  to authenticated
  using (true) with check (true);
