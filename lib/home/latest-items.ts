import { createSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase/server';
import { listPublishedContents } from '@/lib/data/contents';
import { stripInlineMd } from '@/lib/inline-md';

/**
 * 홈 '최신 콘텐츠' 아이템 — 케이스·트렌드(contents) + 도구·프롬프트(tools) 병합 최신순.
 *
 * 모바일 세로 피드(LatestFeed)와 데스크톱 가로 행(LatestRow)이 같은 소스를 쓴다.
 * 기존에는 page.tsx 안에서 인라인으로 만들던 걸 여기로 뽑아 둘이 공유한다.
 */

/**
 * 홈 뱃지는 전부 '대분류(트랙)' 라벨로 통일한다 — 실전 케이스 / AI 트렌드 / AI 도구 / 프롬프트.
 * 케이스만 직무 라벨(기획·마케팅·1인사업…)을 쓰면 한 줄 안에서 혼자 층위가 달라 보인다.
 * 직무 라벨은 케이스가 전부인 목록 페이지(/cases)에서만 쓴다.
 */
const TRACK_LABEL: Record<LatestKind, string> = {
  case: '실전 케이스',
  trend: 'AI 트렌드',
  tool: 'AI 도구',
  prompt: '프롬프트',
};

/** 피드/행에서 쓰는 콘텐츠 타입 — 필터 칩·뱃지 색 구분용 */
export type LatestKind = 'case' | 'trend' | 'tool' | 'prompt';

export interface LatestItem {
  id: string;
  /** 히어로 중복 제거용 — withoutHero() 가 쓴다 */
  slug: string;
  href: string;
  title: string;
  summary: string | null;
  thumbnail_url: string | null;
  thumbEmoji?: string | null;
  /** 화면에 찍히는 한글 라벨 (기획 / AI 트렌드 / AI 도구 / 프롬프트) */
  badge: string;
  kind: LatestKind;
  dateLabel: string;
  readMin?: number | null;
  /** 발행 N일 이내 → NEW 표시. 서버에서 확정해 하이드레이션 불일치 방지 */
  isNew: boolean;
}

type FeedToolRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  thumbnail_emoji: string | null;
  category: 'tool' | 'prompt';
  created_at: string;
};

async function listFeedTools(): Promise<FeedToolRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('tools')
    .select('id, slug, name, description, thumbnail_url, thumbnail_emoji, category, created_at')
    .eq('status', 'published')
    .in('category', ['tool', 'prompt'])
    .order('created_at', { ascending: false })
    .limit(24);
  return (data ?? []) as FeedToolRow[];
}

/** ISO 앞 10자(YYYY-MM-DD)를 점 구분으로 — Date 파싱 없이 서버·클라 동일 문자열 */
function dateLabel(iso: string | null | undefined): string {
  return (iso ?? '').slice(0, 10).replace(/-/g, '.');
}

const NEW_DAYS = 7;

export async function getLatestItems(opts: { limit?: number } = {}): Promise<LatestItem[]> {
  const { limit = 24 } = opts;
  const [contents, tools] = await Promise.all([
    listPublishedContents({ limit }),
    listFeedTools(),
  ]);

  const nowMs = Date.now();
  const isFresh = (iso: string | null | undefined) => {
    if (!iso) return false;
    const t = Date.parse(iso);
    return Number.isFinite(t) && nowMs - t < NEW_DAYS * 86_400_000;
  };

  type Staged = LatestItem & { date: string | null };

  const staged: Staged[] = [
    ...contents.map((c) => ({
      id: c.id,
      slug: c.slug,
      href: `/${c.track === 'case' ? 'cases' : 'trends'}/${c.slug}`,
      title: c.title,
      summary: c.summary,
      thumbnail_url: c.thumbnail_url,
      badge: c.track === 'trend' ? TRACK_LABEL.trend : TRACK_LABEL.case,
      kind: (c.track === 'trend' ? 'trend' : 'case') as LatestKind,
      readMin: c.read_min,
      date: c.published_at ?? c.created_at,
      dateLabel: dateLabel(c.published_at ?? c.created_at),
      isNew: isFresh(c.published_at ?? c.created_at),
    })),
    ...tools.map((t) => ({
      id: t.id,
      slug: t.slug,
      href: `/${t.category === 'prompt' ? 'prompts' : 'tools'}/${t.slug}`,
      title: t.name,
      summary: t.description ? stripInlineMd(t.description) : null,
      thumbnail_url: t.thumbnail_url,
      thumbEmoji: t.thumbnail_emoji,
      badge: t.category === 'prompt' ? TRACK_LABEL.prompt : TRACK_LABEL.tool,
      kind: t.category as LatestKind,
      readMin: null,
      date: t.created_at,
      dateLabel: dateLabel(t.created_at),
      isNew: isFresh(t.created_at),
    })),
  ].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

  return staged.slice(0, limit).map(({ date: _date, ...item }) => item);
}

/**
 * 히어로 1번 슬라이드만 최신 목록에서 뺀다 (기존 홈 규칙 유지).
 *
 * 큐레이션 5건을 전부 빼는 것도 해봤지만, 발행분이 적을 때 그리드가 한 줄로 쪼그라든다.
 * 2번 이후 슬라이드는 사용자가 화살표를 눌러야 보이므로 그리드에 다시 나와도 중복으로 느껴지지 않는다.
 * 반면 1번 슬라이드는 무조건 보이니 바로 아래에서 또 만나면 티가 난다 — 이것만 뺀다.
 */
export function withoutHeroTop(items: LatestItem[], heroTopSlug?: string): LatestItem[] {
  if (!heroTopSlug) return items;
  return items.filter((it) => it.slug !== heroTopSlug);
}
