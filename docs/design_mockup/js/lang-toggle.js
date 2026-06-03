// CaseLab — 공통 언어 토글 (EN/KR + Google Translate)
// 모든 user 페이지의 GNB에 EN/KR 버튼을 동적으로 추가.
(function(){
  // 이미 같은 버튼이 있는 페이지(예: index.html 인라인 정의)는 건너뜀
  if (document.getElementById('langToggle')) return;

  // CSS 주입
  var style = document.createElement('style');
  style.textContent =
    '.lang-toggle{font-size:12px;font-weight:700;color:#8b95a1;border:1px solid #e5e8eb;padding:4px 10px;border-radius:6px;background:transparent;cursor:pointer;transition:all .12s;letter-spacing:0.02em;font-family:inherit;margin-left:4px}' +
    '.lang-toggle:hover{border-color:#b0b8c1;color:#191f28}' +
    '.lang-toggle.on{background:#191f28;color:#fff;border-color:#191f28}' +
    '.goog-te-banner-frame,.skiptranslate,#goog-gt-tt{display:none !important}' +
    'body{top:0 !important}';
  document.head.appendChild(style);

  var isEn = false;

  window.googleTranslateElementInit = function() {
    if (typeof google !== 'undefined' && google.translate) {
      new google.translate.TranslateElement({
        pageLanguage: 'ko',
        includedLanguages: 'en',
        autoDisplay: false
      }, 'google_translate_element');
    }
  };

  window.toggleLang = function() {
    var btn = document.getElementById('langToggle');
    if (!btn) return;
    isEn = !isEn;
    btn.textContent = isEn ? 'KR' : 'EN';
    btn.classList.toggle('on', isEn);
    var combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = isEn ? 'en' : '';
      combo.dispatchEvent(new Event('change'));
      if (!isEn) {
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + location.hostname;
        location.reload();
      }
    }
  };

  function setup() {
    var gnbRight = document.querySelector('.gnb-right');
    if (!gnbRight || document.getElementById('langToggle')) return;

    var btn = document.createElement('button');
    btn.className = 'lang-toggle';
    btn.id = 'langToggle';
    btn.type = 'button';
    btn.textContent = 'EN';
    btn.addEventListener('click', window.toggleLang);
    gnbRight.appendChild(btn);

    var gte = document.createElement('div');
    gte.id = 'google_translate_element';
    gte.style.display = 'none';
    document.body.appendChild(gte);

    var s = document.createElement('script');
    s.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.body.appendChild(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
