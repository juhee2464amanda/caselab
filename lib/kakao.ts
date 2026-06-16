// Kakao JS SDK 로더 + 공유 헬퍼
// SDK를 동적으로 1회만 로드/초기화하고, Kakao.Share.sendDefault()로 공유 팝업을 띄운다.

const SDK_SRC = 'https://t1.kakao.com/kakao_js_sdk/2.7.2/kakao.min.js';

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (settings: Record<string, unknown>) => void;
      };
    };
  }
}

let loadPromise: Promise<void> | null = null;

function loadSdk(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.Kakao) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SDK_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Kakao SDK load failed'));
    };
    document.head.appendChild(script);
  });
  return loadPromise;
}

/** SDK 로드 + init 보장. 성공 시 window.Kakao 반환, 실패/키 없음 시 null. */
async function ensureKakao(): Promise<NonNullable<typeof window.Kakao> | null> {
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
  if (!key) return null;
  try {
    await loadSdk();
  } catch {
    return null;
  }
  const Kakao = window.Kakao;
  if (!Kakao) return null;
  if (!Kakao.isInitialized()) {
    Kakao.init(key);
  }
  return Kakao;
}

interface ShareOptions {
  url: string;
  title: string;
  description?: string;
  imageUrl?: string;
}

/**
 * 카카오톡 공유 팝업을 띄운다.
 * SDK 사용 불가(키 없음/로드 실패) 시 false를 반환하므로 호출부에서 폴백 처리한다.
 */
export async function shareToKakao({
  url,
  title,
  description,
  imageUrl,
}: ShareOptions): Promise<boolean> {
  const Kakao = await ensureKakao();
  if (!Kakao) return false;

  Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title,
      description: description ?? '',
      ...(imageUrl ? { imageUrl } : {}),
      link: { mobileWebUrl: url, webUrl: url },
    },
    buttons: [
      {
        title: '자세히 보기',
        link: { mobileWebUrl: url, webUrl: url },
      },
    ],
  });
  return true;
}
