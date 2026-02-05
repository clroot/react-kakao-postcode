import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { useKakaoPostcode, type UseKakaoPostcodeOptions } from './useKakaoPostcode';
import type { LoaderStatus, OpenOptions } from './loader/types';

export interface PostcodePopupProps extends UseKakaoPostcodeOptions {
  openOptions?: OpenOptions;
  children: ReactNode | ((api: { open: () => void; status: LoaderStatus }) => ReactNode);
}

export default function PostcodePopup({ openOptions, children, ...options }: PostcodePopupProps) {
  const { open, status } = useKakaoPostcode(options);

  const handleOpen = () => open(openOptions);

  if (typeof children === 'function') {
    return <>{children({ open: handleOpen, status })}</>;
  }

  if (isValidElement(children)) {
    const child = children as ReactElement<{ onClick?: (...args: unknown[]) => void }>;
    return cloneElement(child, {
      onClick: (...args: unknown[]) => {
        handleOpen();
        child.props.onClick?.(...args);
      },
    });
  }

  return <>{children}</>;
}
