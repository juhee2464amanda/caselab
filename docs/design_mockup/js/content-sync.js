// ============================================
// CaseLab — 콘텐츠 인라인 편집 + 페이지 간 동기화
// ============================================
// admin만 편집 가능. URL에 ?edit=1 또는 admin role일 때 활성화.
// 일반 유저는 저장된 수정 내역만 반영(읽기 전용).
// ============================================

(function() {
  var STORAGE_KEY = 'caselab_content_edits';
  var ADMIN_KEY = 'caselab_admin_mode';

  // admin 모드 판별: ?edit=1 파라미터 또는 localStorage 플래그
  var urlParams = new URLSearchParams(window.location.search);
  var isAdmin = urlParams.get('edit') === '1' || localStorage.getItem(ADMIN_KEY) === '1';

  // ?edit=1이면 세션 유지
  if (urlParams.get('edit') === '1') localStorage.setItem(ADMIN_KEY, '1');
  // ?edit=0이면 해제
  if (urlParams.get('edit') === '0') localStorage.removeItem(ADMIN_KEY);

  function getEdits() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch(e) { return {}; }
  }

  function saveEdit(contentId, field, value) {
    var edits = getEdits();
    if (!edits[contentId]) edits[contentId] = {};
    edits[contentId][field] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(edits));
  }

  // 저장된 수정 내역 반영 (모든 유저)
  function applyEdits() {
    var edits = getEdits();
    Object.keys(edits).forEach(function(contentId) {
      Object.keys(edits[contentId]).forEach(function(field) {
        var value = edits[contentId][field];
        document.querySelectorAll('[data-content-id="' + contentId + '"][data-field="' + field + '"]').forEach(function(el) {
          // innerText로 반영해야 줄바꿈(\n)이 <br>로 렌더링됨
          if (el.innerText !== value) el.innerText = value;
        });
      });
    });
  }

  // admin만: contenteditable 활성화
  function initEditable() {
    if (!isAdmin) return;

    // admin 표시 배지
    var badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9999;padding:6px 14px;background:#3182f6;color:#fff;font-size:12px;font-weight:700;border-radius:8px;font-family:Pretendard,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.15)';
    badge.textContent = 'EDIT MODE';
    document.body.appendChild(badge);

    // data 속성 있는 요소
    document.querySelectorAll('[data-content-id][data-field]').forEach(function(el) {
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'false');
      el.addEventListener('blur', function() {
        // innerText로 저장해야 줄바꿈(\n)이 보존됨
        saveEdit(this.dataset.contentId, this.dataset.field, this.innerText.trim());
      });
      el.addEventListener('keydown', function(e) {
        // Enter → 줄바꿈 삽입 (기존엔 편집 종료됐음). Esc → 편집 종료
        if (e.key === 'Enter') { e.preventDefault(); document.execCommand('insertLineBreak'); }
        else if (e.key === 'Escape') { e.preventDefault(); this.blur(); }
      });
    });

    // 일반 텍스트 요소도 편집 가능 (동기화는 안 되지만 수정 가능)
    document.querySelectorAll('h1,h2,h3,h4,.prose p,.role-card p,.result > div,.highlight-box,.art-meta span,.sec-title,.a-title,.a-desc,.feat-title,.feat-desc,.series-name,.series-desc,.preview-title,.vc-title,.pop-title,.pop-head,.hero-text .h-desc,.gnb-sub-msg,.footer-txt,.ebook-title,.ebook-desc').forEach(function(el) {
      if (!el.hasAttribute('contenteditable')) {
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'false');
      }
    });
  }

  // 실행
  applyEdits();
  initEditable();

  window.addEventListener('storage', function(e) {
    if (e.key === STORAGE_KEY) applyEdits();
  });
})();