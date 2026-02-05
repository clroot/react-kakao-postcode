import type { CSSProperties } from 'react';
import { useKakaoPostcode, type UseKakaoPostcodeOptions } from './useKakaoPostcode';

export interface PostcodeProps extends UseKakaoPostcodeOptions {
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_STYLE: CSSProperties = {
  width: '100%',
  height: 400,
};

export default function Postcode({ className, style, ...options }: PostcodeProps) {
  const { status, error, embedRef } = useKakaoPostcode(options);

  if (status === 'error') {
    return <p role="alert">{error?.message ?? 'Failed to load Kakao Postcode'}</p>;
  }

  return <div ref={embedRef} className={className} style={{ ...DEFAULT_STYLE, ...style }} />;
}
