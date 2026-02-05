export { useKakaoPostcode } from './useKakaoPostcode';
export { default as Postcode } from './Postcode';
export { default as PostcodePopup } from './PostcodePopup';
export { createPostcodeLoader, defaultLoader, DEFAULT_SCRIPT_URL } from './loader/createPostcodeLoader';

export type { UseKakaoPostcodeOptions, UseKakaoPostcodeReturn } from './useKakaoPostcode';
export type { PostcodeProps } from './Postcode';
export type { PostcodePopupProps } from './PostcodePopup';
export type {
  Address,
  Size,
  CloseState,
  SearchData,
  Theme,
  PostcodeOptions,
  OpenOptions,
  EmbedOptions,
  Postcode as PostcodeInstance,
  PostcodeConstructor,
  LoaderStatus,
  LoaderConfig,
  PostcodeLoader,
} from './loader/types';
