import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Postcode from '../Postcode';

// ─── Mocks ───────────────────────────────────

const mockEmbedRef = vi.fn();

vi.mock('../useKakaoPostcode', () => ({
  useKakaoPostcode: vi.fn(() => ({
    status: 'ready',
    error: null,
    open: vi.fn(),
    embedRef: mockEmbedRef,
    close: vi.fn(),
  })),
}));

import { useKakaoPostcode } from '../useKakaoPostcode';
const mockUseKakaoPostcode = vi.mocked(useKakaoPostcode);

describe('Postcode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseKakaoPostcode.mockReturnValue({
      status: 'ready',
      error: null,
      open: vi.fn(),
      embedRef: mockEmbedRef,
      close: vi.fn(),
    });
  });

  it('wrapper div를 렌더링한다', () => {
    const { container } = render(<Postcode />);
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
  });

  it('기본 스타일(width: 100%, height: 400)을 적용한다', () => {
    const { container } = render(<Postcode />);
    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper.style.width).toBe('100%');
    expect(wrapper.style.height).toBe('400px');
  });

  it('사용자 정의 className과 style을 적용한다', () => {
    const { container } = render(
      <Postcode className='my-class' style={{ height: 600 }} />,
    );
    const wrapper = container.firstChild as HTMLElement;

    expect(wrapper).toHaveClass('my-class');
    expect(wrapper.style.height).toBe('600px');
  });

  it('embedRef를 div에 연결한다', () => {
    render(<Postcode />);
    expect(mockEmbedRef).toHaveBeenCalled();
  });

  it('에러 상태에서 에러 메시지를 표시한다', async () => {
    mockUseKakaoPostcode.mockReturnValue({
      status: 'error',
      error: new Error('스크립트 로드 실패'),
      open: vi.fn(),
      embedRef: mockEmbedRef,
      close: vi.fn(),
    });

    render(<Postcode />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('스크립트 로드 실패');
    });
  });

  it('옵션을 useKakaoPostcode에 전달한다', () => {
    const onComplete = vi.fn();
    render(<Postcode onComplete={onComplete} defaultQuery='강남' />);

    expect(mockUseKakaoPostcode).toHaveBeenCalledWith(
      expect.objectContaining({ onComplete, defaultQuery: '강남' }),
    );
  });
});
