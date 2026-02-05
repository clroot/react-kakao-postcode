import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPostcodeLoader } from '../loader/createPostcodeLoader';
import type { PostcodeConstructor } from '../loader/types';

const originalCreateElement = document.createElement.bind(document);

function mockScript(options: {
  onLoad?: () => void;
  onError?: boolean;
  delay?: number;
}) {
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = originalCreateElement(tag) as HTMLScriptElement;
    if (tag === 'script') {
      setTimeout(() => {
        if (options.onError) {
          el.onerror?.(new Event('error'));
        } else {
          options.onLoad?.();
          el.onload?.(new Event('load'));
        }
      }, options.delay ?? 0);
    }
    return el;
  });
}

function createMockConstructor(): PostcodeConstructor {
  return vi.fn(function () {
    return { open: vi.fn(), embed: vi.fn() };
  }) as unknown as PostcodeConstructor;
}

describe('createPostcodeLoader', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    delete window.kakao;
    delete window.daum;
  });

  it('초기 status는 idle이다', () => {
    const loader = createPostcodeLoader();
    expect(loader.getStatus()).toBe('idle');
  });

  it('스크립트 로드 성공 시 PostcodeConstructor를 반환한다', async () => {
    const MockConstructor = createMockConstructor();
    mockScript({ onLoad: () => { window.kakao = { Postcode: MockConstructor }; } });

    const loader = createPostcodeLoader();
    const result = await loader.load();

    expect(result).toBe(MockConstructor);
    expect(loader.getStatus()).toBe('ready');
  });

  it('kakao 네임스페이스를 daum보다 우선한다', async () => {
    const KakaoConstructor = createMockConstructor();
    const DaumConstructor = createMockConstructor();
    mockScript({
      onLoad: () => {
        window.kakao = { Postcode: KakaoConstructor };
        window.daum = { Postcode: DaumConstructor };
      },
    });

    const loader = createPostcodeLoader();
    const result = await loader.load();

    expect(result).toBe(KakaoConstructor);
  });

  it('kakao가 없으면 daum으로 폴백한다', async () => {
    const DaumConstructor = createMockConstructor();
    mockScript({ onLoad: () => { window.daum = { Postcode: DaumConstructor }; } });

    const loader = createPostcodeLoader();
    const result = await loader.load();

    expect(result).toBe(DaumConstructor);
  });

  it('중복 load() 호출 시 같은 Promise를 반환한다', async () => {
    const MockConstructor = createMockConstructor();
    mockScript({ onLoad: () => { window.kakao = { Postcode: MockConstructor }; } });

    const loader = createPostcodeLoader();
    const p1 = loader.load();
    const p2 = loader.load();

    expect(p1).toBe(p2);
    await p1;
  });

  it('스크립트 에러 시 retry한다', async () => {
    const MockConstructor = createMockConstructor();
    let attempt = 0;

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag) as HTMLScriptElement;
      if (tag === 'script') {
        setTimeout(() => {
          attempt++;
          if (attempt <= 1) {
            el.onerror?.(new Event('error'));
          } else {
            window.kakao = { Postcode: MockConstructor };
            el.onload?.(new Event('load'));
          }
        }, 0);
      }
      return el;
    });

    const loader = createPostcodeLoader({ maxRetries: 2 });
    const result = await loader.load();

    expect(result).toBe(MockConstructor);
    expect(attempt).toBe(2);
  });

  it('maxRetries 초과 시 에러를 throw한다', async () => {
    mockScript({ onError: true });

    const loader = createPostcodeLoader({ maxRetries: 0 });

    await expect(loader.load()).rejects.toThrow('Failed to load script');
    expect(loader.getStatus()).toBe('error');
  });

  it('에러 후 reset()하면 재시도할 수 있다', async () => {
    mockScript({ onError: true });

    const loader = createPostcodeLoader({ maxRetries: 0 });

    await expect(loader.load()).rejects.toThrow();
    expect(loader.getStatus()).toBe('error');

    loader.reset();
    expect(loader.getStatus()).toBe('idle');

    // 이제 성공하도록 변경
    vi.restoreAllMocks();
    const MockConstructor = createMockConstructor();
    mockScript({ onLoad: () => { window.kakao = { Postcode: MockConstructor }; } });

    const result = await loader.load();
    expect(result).toBe(MockConstructor);
    expect(loader.getStatus()).toBe('ready');
  });

  it('이미 window에 로드된 경우 스크립트를 추가하지 않는다', async () => {
    const MockConstructor = createMockConstructor();
    window.kakao = { Postcode: MockConstructor };

    const createSpy = vi.spyOn(document, 'createElement');

    const loader = createPostcodeLoader();
    const result = await loader.load();

    expect(result).toBe(MockConstructor);
    expect(createSpy).not.toHaveBeenCalledWith('script');
  });

  it('timeout 시 에러를 throw한다', async () => {
    mockScript({ delay: 500 });

    const loader = createPostcodeLoader({ timeout: 50, maxRetries: 0 });

    await expect(loader.load()).rejects.toThrow('timeout');
    expect(loader.getStatus()).toBe('error');
  });
});
