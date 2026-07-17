import type { GuideItem } from '@/types/guide';

// 브랜드 대표 키워드 → public/logos/ 로고 매핑.
// 순서 중요: GitHub 저장소여도 브랜드(anthropic, microsoft 등)가 먼저 매칭되도록
// 범용 github 은 마지막에 둔다.
const GUIDE_LOGOS: { logo: string; match: RegExp }[] = [
  { logo: '/logos/claude.png', match: /anthropic|claude/i },
  { logo: '/logos/openai.png', match: /openai|chatgpt/i },
  { logo: '/logos/gemini.png', match: /gemini|google/i },
  { logo: '/logos/huggingface.png', match: /hugging\s?face/i },
  { logo: '/logos/deeplearning-ai.png', match: /deeplearning/i },
  { logo: '/logos/microsoft.png', match: /microsoft/i },
  { logo: '/logos/stanford-hai.png', match: /stanford/i },
  { logo: '/logos/cursor.png', match: /cursor/i },
  { logo: '/logos/mcp.png', match: /model\s?context\s?protocol|modelcontextprotocol|\bmcp\b/i },
  { logo: '/logos/github.png', match: /github/i },
];

type GuideLogoSource = Pick<GuideItem, 'slug' | 'title' | 'url' | 'thumbLabel' | 'source'>;

export function resolveGuideLogo(guide: GuideLogoSource): string | null {
  const haystack = [guide.slug, guide.title, guide.thumbLabel, guide.url, guide.source]
    .filter(Boolean)
    .join(' ');
  for (const { logo, match } of GUIDE_LOGOS) {
    if (match.test(haystack)) return logo;
  }
  return null;
}
