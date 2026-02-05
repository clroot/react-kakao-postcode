import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PostcodePopup from '../PostcodePopup';

// ─── Mocks ───────────────────────────────────

const mockOpen = vi.fn();

vi.mock('../useKakaoPostcode', () => ({
  useKakaoPostcode: vi.fn(() => ({
    status: 'ready',
    error: null,
    open: mockOpen,
    embedRef: vi.fn(),
    close: vi.fn(),
  })),
}));

describe('PostcodePopup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('children으로 전달된 버튼을 렌더링한다', () => {
    render(
      <PostcodePopup>
        <button>주소 검색</button>
      </PostcodePopup>,
    );

    expect(screen.getByText('주소 검색')).toBeInTheDocument();
  });

  it('children 버튼 클릭 시 open()을 호출한다', () => {
    render(
      <PostcodePopup>
        <button>주소 검색</button>
      </PostcodePopup>,
    );

    fireEvent.click(screen.getByText('주소 검색'));
    expect(mockOpen).toHaveBeenCalled();
  });

  it('openOptions를 open()에 전달한다', () => {
    render(
      <PostcodePopup openOptions={{ left: 100, popupTitle: '주소' }}>
        <button>주소 검색</button>
      </PostcodePopup>,
    );

    fireEvent.click(screen.getByText('주소 검색'));
    expect(mockOpen).toHaveBeenCalledWith({ left: 100, popupTitle: '주소' });
  });

  it('children의 기존 onClick도 함께 호출한다', () => {
    const childOnClick = vi.fn();
    render(
      <PostcodePopup>
        <button onClick={childOnClick}>주소 검색</button>
      </PostcodePopup>,
    );

    fireEvent.click(screen.getByText('주소 검색'));
    expect(mockOpen).toHaveBeenCalled();
    expect(childOnClick).toHaveBeenCalled();
  });

  it('render prop 패턴을 지원한다', () => {
    render(
      <PostcodePopup>
        {({ open, status }) => (
          <button onClick={open}>
            {status === 'ready' ? '주소 검색' : '로딩 중'}
          </button>
        )}
      </PostcodePopup>,
    );

    expect(screen.getByText('주소 검색')).toBeInTheDocument();
    fireEvent.click(screen.getByText('주소 검색'));
    expect(mockOpen).toHaveBeenCalled();
  });
});
