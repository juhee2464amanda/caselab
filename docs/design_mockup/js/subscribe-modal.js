// ============================================
// CaseLab — 공통 구독 모달
// ============================================
// 모든 페이지에서 .gnb-sub 버튼 클릭 시 동작하도록 모달 HTML/CSS/JS를 동적 주입.
// index.html은 이미 인라인 모달이 있으므로 중복 주입 방지.
// ============================================

(function() {
  if (document.getElementById('subModal')) {
    // 이미 modal 있음 (index.html 등) — 버튼만 연결
    bindButtons();
    return;
  }

  var modalCSS = ''
    + '.modal-dim{display:none;position:fixed;inset:0;z-index:999;background:rgba(0,0,0,.45);justify-content:center;align-items:center;padding:24px;font-family:Pretendard,-apple-system,BlinkMacSystemFont,system-ui,sans-serif}'
    + '.modal-dim.open{display:flex}'
    + '.modal{background:#fff;border-radius:16px;width:100%;max-width:480px;padding:40px 36px 36px;position:relative;letter-spacing:-0.02em}'
    + '.modal-close{position:absolute;top:16px;right:16px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;border-radius:8px;color:#8b95a1;background:none;border:none;cursor:pointer}'
    + '.modal-close:hover{background:#f2f4f6}'
    + '.modal-close svg{width:18px;height:18px}'
    + '.modal h2{font-size:22px;font-weight:800;letter-spacing:-0.03em;margin-bottom:8px;color:#191f28}'
    + '.modal .modal-desc{font-size:15px;color:#6b7684;line-height:1.5;margin-bottom:28px}'
    + '.modal .form-label{font-size:14px;font-weight:600;color:#191f28;margin-bottom:6px;display:block}'
    + '.modal .form-input{width:100%;padding:12px 14px;font-size:15px;font-family:inherit;border:1px solid #e5e8eb;border-radius:10px;outline:none;margin-bottom:20px;color:#191f28;letter-spacing:-0.02em}'
    + '.modal .form-input::placeholder{color:#b0b8c1}'
    + '.modal .form-input:focus{border-color:#3182f6}'
    + '.modal .form-select{width:100%;padding:12px 14px;font-size:15px;font-family:inherit;border:1px solid #e5e8eb;border-radius:10px;outline:none;margin-bottom:20px;color:#b0b8c1;background:#fff;appearance:none;cursor:pointer;letter-spacing:-0.02em}'
    + '.modal .form-select:focus{border-color:#3182f6}'
    + '.modal .form-select.selected{color:#191f28}'
    + '.modal .form-check{display:flex;align-items:flex-start;gap:8px;margin-bottom:24px}'
    + '.modal .form-check input[type="checkbox"]{width:20px;height:20px;margin-top:1px;accent-color:#3182f6;flex-shrink:0}'
    + '.modal .form-check label{font-size:13px;color:#6b7684;line-height:1.45}'
    + '.modal .form-check label a{color:#3182f6;text-decoration:underline;text-underline-offset:2px}'
    + '.modal .form-submit{width:100%;padding:14px;font-size:16px;font-weight:700;font-family:inherit;color:#fff;background:#3182f6;border:none;border-radius:10px;cursor:pointer;letter-spacing:-0.02em}'
    + '.modal .form-submit:hover{background:#1b6ef2}';

  var modalHTML = ''
    + '<div class="modal-dim" id="subModal">'
    +   '<div class="modal">'
    +     '<button class="modal-close" id="subModalClose" aria-label="닫기">'
    +       '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    +     '</button>'
    +     '<h2>콘텐츠 구독하기</h2>'
    +     '<p class="modal-desc">케이스랩 뉴스레터를 구독하고, 관심 직군의 콘텐츠를 받아보세요.</p>'
    +     '<form onsubmit="return false;">'
    +       '<label class="form-label" for="sub-name">이름</label>'
    +       '<input class="form-input" id="sub-name" type="text" placeholder="ex) 김케랩" autocomplete="name" />'
    +       '<label class="form-label" for="sub-email">이메일</label>'
    +       '<input class="form-input" id="sub-email" type="email" placeholder="ex) you@company.com" autocomplete="email" />'
    +       '<div class="form-check">'
    +         '<input type="checkbox" id="sub-agree" />'
    +         '<label for="sub-agree">(필수) 뉴스레터 수신을 위한 <a href="#">개인정보 수집 및 이용</a>에 동의합니다</label>'
    +       '</div>'
    +       '<button type="submit" class="form-submit">동의하고 구독하기</button>'
    +     '</form>'
    +   '</div>'
    + '</div>';

  // Inject CSS
  var styleEl = document.createElement('style');
  styleEl.textContent = modalCSS;
  document.head.appendChild(styleEl);

  // Inject Modal
  var wrap = document.createElement('div');
  wrap.innerHTML = modalHTML;
  document.body.appendChild(wrap.firstElementChild);

  var modal = document.getElementById('subModal');
  var closeBtn = document.getElementById('subModalClose');
  var select = document.getElementById('sub-category');

  if (closeBtn) closeBtn.addEventListener('click', function() { modal.classList.remove('open'); });
  if (select) select.addEventListener('change', function() { this.classList.toggle('selected', this.value !== ''); });
  modal.addEventListener('click', function(e) { if (e.target === modal) modal.classList.remove('open'); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') modal.classList.remove('open'); });

  bindButtons();

  function bindButtons() {
    window.openSubscribeModal = function() {
      var m = document.getElementById('subModal');
      if (m) m.classList.add('open');
    };
    document.querySelectorAll('.gnb-sub').forEach(function(btn) {
      // 인라인 onclick이 있으면 그대로 둠 (index.html처럼)
      if (!btn.getAttribute('onclick')) {
        btn.addEventListener('click', window.openSubscribeModal);
      }
    });
  }
})();
