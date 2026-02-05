import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useKakaoPostcode } from '../useKakaoPostcode';
import type { PostcodeConstructor } from '../loader/types';

// ─── Mocks ───────────────────────────────────

const mockOpen = vi.fn();
const mockEmbed = vi.fn();
const MockConstructor = vi.fn(function () {
  return { open: mockOpen, embed: mockEmbed };
}) as unknown as PostcodeConstructor;

const mockLoad = vi.fn<() => Promise<PostcodeConstructor>>();

vi.mock('../loader/createPostcodeLoader', () => ({
  createPostcodeLoader: () => ({
    load: () => mockLoad(),
    getStatus: () => 'idle',
    reset: vi.fn(),
  }),
  defaultLoader: {
    load: () => mockLoad(),
    getStatus: () => 'idle',
    reset: vi.fn(),
  },
}));

// ─── Tests ───────────────────────────────────

describe('useKakaoPostcode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoad.mockResolvedValue(MockConstructor);
  });

  describe('status 관리', () => {
    it('초기 status는 idle이다', () => {
      const { result } = renderHook(() => useKakaoPostcode());
      expect(result.current.status).toBe('idle');
    });

    it('embedRef 호출 시 loading → ready로 전환된다', async () => {
      const { result } = renderHook(() => useKakaoPostcode());
      const el = document.createElement('div');

      await act(async () => {
        result.current.embedRef(el);
        await mockLoad();
      });

      await waitFor(() => {
        expect(result.current.status).toBe('ready');
      });
    });

    it('로드 실패 시 error 상태가 된다', async () => {
      // 첫 번째(preload)는 성공, 두 번째(embedRef)부터 실패
      const loadError = new Error('Load failed');
      mockLoad
        .mockResolvedValueOnce(MockConstructor)
        .mockRejectedValue(loadError);

      const onError = vi.fn();
      const { result } = renderHook(() => useKakaoPostcode({ onError }));
      const el = document.createElement('div');

      await act(async () => {
        result.current.embedRef(el);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error?.message).toBe('Load failed');
        expect(onError).toHaveBeenCalled();
      });
    });
  });

  describe('embedRef', () => {
    it('DOM 요소를 전달하면 embed를 호출한다', async () => {
      const { result } = renderHook(() => useKakaoPostcode());
      const el = document.createElement('div');

      await act(async () => {
        result.current.embedRef(el);
        await mockLoad();
      });

      await waitFor(() => {
        expect(MockConstructor).toHaveBeenCalled();
        expect(mockEmbed).toHaveBeenCalledWith(el, expect.objectContaining({ autoClose: true }));
      });
    });

    it('null을 전달하면 아무 동작도 하지 않는다', async () => {
      const { result } = renderHook(() => useKakaoPostcode());

      await act(async () => {
        result.current.embedRef(null);
      });

      expect(MockConstructor).not.toHaveBeenCalled();
    });

    it('같은 요소를 중복 전달하면 무시한다', async () => {
      const { result } = renderHook(() => useKakaoPostcode());
      const el = document.createElement('div');

      await act(async () => {
        result.current.embedRef(el);
        await mockLoad();
      });

      await act(async () => {
        result.current.embedRef(el);
      });

      expect(mockEmbed).toHaveBeenCalledTimes(1);
    });

    it('defaultQuery를 embed 옵션으로 전달한다', async () => {
      const { result } = renderHook(() => useKakaoPostcode({ defaultQuery: '서울' }));
      const el = document.createElement('div');

      await act(async () => {
        result.current.embedRef(el);
        await mockLoad();
      });

      await waitFor(() => {
        expect(mockEmbed).toHaveBeenCalledWith(el, expect.objectContaining({ q: '서울' }));
      });
    });
  });

  describe('open', () => {
    it('팝업을 연다', async () => {
      const { result } = renderHook(() => useKakaoPostcode());

      await act(async () => {
        result.current.open();
        await mockLoad();
      });

      await waitFor(() => {
        expect(MockConstructor).toHaveBeenCalled();
        expect(mockOpen).toHaveBeenCalled();
      });
    });

    it('OpenOptions를 전달한다', async () => {
      const { result } = renderHook(() => useKakaoPostcode());

      await act(async () => {
        result.current.open({ left: 100, top: 200, popupTitle: '주소' });
        await mockLoad();
      });

      await waitFor(() => {
        expect(mockOpen).toHaveBeenCalledWith(
          expect.objectContaining({ left: 100, top: 200, popupTitle: '주소' }),
        );
      });
    });

    it('defaultQuery를 팝업 옵션에 포함한다', async () => {
      const { result } = renderHook(() => useKakaoPostcode({ defaultQuery: '강남' }));

      await act(async () => {
        result.current.open();
        await mockLoad();
      });

      await waitFor(() => {
        expect(mockOpen).toHaveBeenCalledWith(expect.objectContaining({ q: '강남' }));
      });
    });
  });

  describe('callbacks', () => {
    it('onComplete 콜백을 Postcode 인스턴스에 연결한다', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => useKakaoPostcode({ onComplete }));
      const el = document.createElement('div');

      await act(async () => {
        result.current.embedRef(el);
        await mockLoad();
      });

      // MockConstructor에 전달된 oncomplete 가져오기
      const constructorCall = (MockConstructor as ReturnType<typeof vi.fn>).mock.calls[0][0];
      constructorCall.oncomplete({ zonecode: '12345' });

      expect(onComplete).toHaveBeenCalledWith({ zonecode: '12345' });
    });
  });
});
