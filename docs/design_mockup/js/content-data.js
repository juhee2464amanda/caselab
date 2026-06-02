// ============================================
// CaseLab — 콘텐츠 메타데이터 (mockup 단계 시뮬레이션용)
// ============================================
// 메인 페이지 "일잘러 자료실" 카드가 이 데이터를 읽어 자동 채움.
// - updatedAt 가장 최신 1건 → "최근 추가"로 노출
// - 카드 신선도(N개 · N일 전 업데이트) 자동 계산
//
// 새 콘텐츠 추가 시:
//   1) 아래 배열에 한 줄 추가
//   2) 메인 HTML은 손대지 않음 — 가장 최신 항목이 자동으로 카드에 올라감
//
// 다음 단계(Supabase 연결):
//   - contents 테이블 만들고 fetch로 교체
//   - 카드 셀렉터(data-auto-fill, data-fill)는 그대로 유지
// ============================================

window.CASELAB_CONTENTS = [
  // ── 쓸만한 AI 도구 ──
  { category: 'tools', title: 'Snipit',                           updatedAt: '2026-06-02', source: 'Caselab 검증' },
  { category: 'tools', title: 'Lovable — 풀스택 앱 한 줄로',     updatedAt: '2026-06-01', source: 'Caselab 검증' },
  { category: 'tools', title: 'Cursor 0.42 — IDE 안의 AI 코딩', updatedAt: '2026-05-30', source: '실무자 사용기' },
  { category: 'tools', title: 'NotebookLM',                     updatedAt: '2026-05-25', source: 'Caselab 검증' },
  { category: 'tools', title: 'v0 — 프롬프트로 UI 만들기',       updatedAt: '2026-05-20', source: '실무자 사용기' },
  { category: 'tools', title: 'Claude Projects',                 updatedAt: '2026-05-15', source: '실무자 사용기' },
  { category: 'tools', title: 'Anthropic Workbench',             updatedAt: '2026-05-10', source: '공식 출시' },

  // ── 바로 쓰는 프롬프트 ──
  { category: 'prompts', title: '기획서 첫 페이지— 전제를 찾아주는 프롬프트', updatedAt: '2026-06-02', source: 'Caselab 검증' },
  { category: 'prompts', title: '경쟁사 분석 구조화 프롬프트',   updatedAt: '2026-05-29', source: 'Anthropic 응용' },
  { category: 'prompts', title: '기획서 전제를 찾아주는 프롬프트', updatedAt: '2026-05-24', source: 'Caselab 검증' },
  { category: 'prompts', title: '윗사람 톤 맞추기 프롬프트',     updatedAt: '2026-05-18', source: 'Caselab 검증' },
  { category: 'prompts', title: '고객 인터뷰 정리 프롬프트',     updatedAt: '2026-05-12', source: 'OpenAI 응용' },

  // ── 공식 가이드 ──
  { category: 'guides', title: 'Anthropic 프롬프트 엔지니어링 가이드', updatedAt: '2026-06-02', source: 'Anthropic 공식' },
  { category: 'guides', title: 'Structured outputs 가이드',     updatedAt: '2026-05-31', source: 'OpenAI 공식' },
  { category: 'guides', title: 'Prompt caching 활용법',         updatedAt: '2026-05-28', source: 'Anthropic 공식' },
  { category: 'guides', title: 'GPT-5 prompting guide',         updatedAt: '2026-05-22', source: 'OpenAI 공식' },
  { category: 'guides', title: 'Claude 4 best practices',       updatedAt: '2026-05-16', source: 'Anthropic 공식' },
  { category: 'guides', title: 'Tool use 기초',                 updatedAt: '2026-05-08', source: 'Anthropic 공식' },

  // ── AI 트렌드 ──
  { category: 'trends', title: 'Claude 메모리 기능, 실제로 일에 쓸만한가— 1주일 실험', updatedAt: '2026-06-02', source: 'Caselab 분석' },
  { category: 'trends', title: 'Anthropic Computer Use, 실무 활용', updatedAt: '2026-06-01', source: 'Caselab 분석' },
  { category: 'trends', title: 'GPT-5 발표, 실무 변화 2가지',    updatedAt: '2026-05-26', source: 'Caselab 분석' },
  { category: 'trends', title: 'v0 0.5 후기',                    updatedAt: '2026-05-19', source: 'Caselab 분석' }
];

// ── 카드 자동 채우기 ──
(function() {
  if (!window.CASELAB_CONTENTS) return;

  function freshLine(items, latest) {
    if (!latest || !latest.updatedAt) return items.length + '개';
    var days = Math.max(0, Math.floor((Date.now() - new Date(latest.updatedAt).getTime()) / 86400000));
    var freshTxt = days === 0 ? '오늘 업데이트' : days + '일 전 업데이트';
    return items.length + '개 · ' + freshTxt;
  }

  function run() {
    document.querySelectorAll('[data-auto-fill]').forEach(function(card) {
      var cat = card.getAttribute('data-auto-fill');
      var items = window.CASELAB_CONTENTS.filter(function(c) { return c.category === cat; });
      if (!items.length) return;

      // 가장 최근에 추가된 1건이 카드 메인에 노출됨
      var sorted = items.slice().sort(function(a, b) {
        return (b.updatedAt || '').localeCompare(a.updatedAt || '');
      });
      var latest = sorted[0];

      var titleEl = card.querySelector('[data-fill="title"]');
      var freshEl = card.querySelector('[data-fill="fresh"]');
      if (titleEl && latest) titleEl.textContent = latest.title;
      if (freshEl) freshEl.textContent = freshLine(items, latest);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
