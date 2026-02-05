import { useCallback, useEffect, useRef, useState } from 'react';
import { createPostcodeLoader, defaultLoader } from './loader/createPostcodeLoader';
import type {
  Address,
  CloseState,
  EmbedOptions,
  LoaderConfig,
  LoaderStatus,
  OpenOptions,
  Postcode,
  PostcodeConstructor,
  PostcodeLoader,
  PostcodeOptions,
  SearchData,
  Size,
} from './loader/types';

// ─── Hook Options ────────────────────────────

export interface UseKakaoPostcodeOptions
  extends Omit<PostcodeOptions, 'oncomplete' | 'onresize' | 'onclose' | 'onsearch'> {
  onComplete?: (address: Address) => void;
  onResize?: (size: Size) => void;
  onClose?: (state: CloseState) => void;
  onSearch?: (data: SearchData) => void;
  onError?: (error: Error) => void;
  scriptUrl?: string;
  timeout?: number;
  maxRetries?: number;
  defaultQuery?: string;
  autoClose?: boolean;
}

// ─── Hook Return ─────────────────────────────

export interface UseKakaoPostcodeReturn {
  status: LoaderStatus;
  error: Error | null;
  open: (options?: OpenOptions) => void;
  embedRef: (element: HTMLElement | null) => void;
  close: () => void;
}

// ─── Hook ────────────────────────────────────

export function useKakaoPostcode(options: UseKakaoPostcodeOptions = {}): UseKakaoPostcodeReturn {
  const {
    onComplete,
    onResize,
    onClose,
    onSearch,
    onError,
    scriptUrl,
    timeout,
    maxRetries,
    defaultQuery = '',
    autoClose = true,
    ...postcodeOptions
  } = options;

  const [status, setStatus] = useState<LoaderStatus>('idle');
  const [error, setError] = useState<Error | null>(null);

  const loaderRef = useRef<PostcodeLoader | null>(null);
  const constructorRef = useRef<PostcodeConstructor | null>(null);
  const postcodeRef = useRef<Postcode | null>(null);
  const embeddedElRef = useRef<HTMLElement | null>(null);

  // 콜백을 ref로 관리하여 최신 값 참조 보장
  const callbacksRef = useRef({ onComplete, onResize, onClose, onSearch, onError });
  useEffect(() => {
    callbacksRef.current = { onComplete, onResize, onClose, onSearch, onError };
  });

  const optionsRef = useRef(postcodeOptions);
  useEffect(() => {
    optionsRef.current = postcodeOptions;
  });

  // loader 결정: 커스텀 config이 있으면 새로 생성, 없으면 기본 인스턴스
  const getLoader = useCallback((): PostcodeLoader => {
    if (scriptUrl || timeout || maxRetries) {
      if (!loaderRef.current) {
        const config: LoaderConfig = {};
        if (scriptUrl) config.scriptUrl = scriptUrl;
        if (timeout) config.timeout = timeout;
        if (maxRetries) config.maxRetries = maxRetries;
        loaderRef.current = createPostcodeLoader(config);
      }
      return loaderRef.current;
    }
    return defaultLoader;
  }, [scriptUrl, timeout, maxRetries]);

  // 스크립트 로드
  const loadConstructor = useCallback(async (): Promise<PostcodeConstructor> => {
    if (constructorRef.current) return constructorRef.current;

    setStatus('loading');
    setError(null);

    try {
      const Constructor = await getLoader().load();
      constructorRef.current = Constructor;
      setStatus('ready');
      return Constructor;
    } catch (err) {
      const loadError = err instanceof Error ? err : new Error(String(err));
      setStatus('error');
      setError(loadError);
      callbacksRef.current.onError?.(loadError);
      throw loadError;
    }
  }, [getLoader]);

  // Postcode 인스턴스 생성
  const createPostcode = useCallback(
    (Constructor: PostcodeConstructor): Postcode => {
      return new Constructor({
        ...optionsRef.current,
        oncomplete: (address: Address) => {
          callbacksRef.current.onComplete?.(address);
        },
        onresize: (size: Size) => {
          callbacksRef.current.onResize?.(size);
        },
        onclose: (state: CloseState) => {
          callbacksRef.current.onClose?.(state);
        },
        onsearch: (data: SearchData) => {
          callbacksRef.current.onSearch?.(data);
        },
      });
    },
    [],
  );

  // preload on mount (캐시 워밍업만, 상태 업데이트 없음)
  useEffect(() => {
    getLoader().load().catch(() => {
      // preload 실패는 무시 — 실제 사용 시 재시도됨
    });
  }, [getLoader]);

  // ─── Public API ──────────────────────────

  const open = useCallback(
    (openOptions?: OpenOptions) => {
      loadConstructor()
        .then((Constructor) => {
          const postcode = createPostcode(Constructor);
          postcodeRef.current = postcode;
          postcode.open({
            q: defaultQuery,
            autoClose,
            ...openOptions,
          });
        })
        .catch(() => {
          // 에러는 status/error state로 전달됨
        });
    },
    [loadConstructor, createPostcode, defaultQuery, autoClose],
  );

  const embedRef = useCallback(
    (element: HTMLElement | null) => {
      if (!element || element === embeddedElRef.current) return;
      embeddedElRef.current = element;

      loadConstructor()
        .then((Constructor) => {
          const postcode = createPostcode(Constructor);
          postcodeRef.current = postcode;

          const embedOptions: EmbedOptions = { q: defaultQuery, autoClose };
          postcode.embed(element, embedOptions);
        })
        .catch(() => {
          // 에러는 status/error state로 전달됨
        });
    },
    [loadConstructor, createPostcode, defaultQuery, autoClose],
  );

  const close = useCallback(() => {
    if (embeddedElRef.current) {
      embeddedElRef.current.innerHTML = '';
      embeddedElRef.current = null;
    }
    callbacksRef.current.onClose?.('FORCE_CLOSE');
  }, []);

  return { status, error, open, embedRef, close };
}
