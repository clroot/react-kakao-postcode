import type { LoaderConfig, LoaderStatus, PostcodeConstructor, PostcodeLoader } from './types';

export const DEFAULT_SCRIPT_URL =
  'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

const DEFAULT_TIMEOUT = 10_000;
const DEFAULT_MAX_RETRIES = 2;

function resolvePostcodeConstructor(): PostcodeConstructor | null {
  return window.kakao?.Postcode ?? window.daum?.Postcode ?? null;
}

function loadScript(url: string, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    const timer = setTimeout(() => {
      script.remove();
      reject(new Error(`Script load timeout after ${timeout}ms: ${url}`));
    }, timeout);

    script.onload = () => {
      clearTimeout(timer);
      resolve();
    };

    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      reject(new Error(`Failed to load script: ${url}`));
    };

    document.body.appendChild(script);
  });
}

export function createPostcodeLoader(config: LoaderConfig = {}): PostcodeLoader {
  const {
    scriptUrl = DEFAULT_SCRIPT_URL,
    timeout = DEFAULT_TIMEOUT,
    maxRetries = DEFAULT_MAX_RETRIES,
  } = config;

  let status: LoaderStatus = 'idle';
  let cachedPromise: Promise<PostcodeConstructor> | null = null;

  async function attemptLoad(): Promise<PostcodeConstructor> {
    // 이미 로드된 경우 바로 반환
    const existing = resolvePostcodeConstructor();
    if (existing) return existing;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await loadScript(scriptUrl, timeout);

        const Constructor = resolvePostcodeConstructor();
        if (Constructor) return Constructor;

        throw new Error('Kakao Postcode constructor not found after script load');
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < maxRetries) continue;
      }
    }

    throw lastError;
  }

  return {
    load(): Promise<PostcodeConstructor> {
      if (cachedPromise) return cachedPromise;

      status = 'loading';

      cachedPromise = attemptLoad()
        .then((Constructor) => {
          status = 'ready';
          return Constructor;
        })
        .catch((error) => {
          status = 'error';
          cachedPromise = null;
          throw error;
        });

      return cachedPromise;
    },

    getStatus(): LoaderStatus {
      return status;
    },

    reset(): void {
      status = 'idle';
      cachedPromise = null;
    },
  };
}

// 편의를 위한 기본 인스턴스
export const defaultLoader = createPostcodeLoader();
