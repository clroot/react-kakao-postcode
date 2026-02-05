// ─── Address ─────────────────────────────────

export interface Address {
  zonecode: string;
  address: string;
  addressEnglish: string;
  addressType: 'R' | 'J';
  userSelectedType: 'R' | 'J';
  noSelected: 'Y' | 'N';
  userLanguageType: 'K' | 'E';
  roadAddress: string;
  roadAddressEnglish: string;
  jibunAddress: string;
  jibunAddressEnglish: string;
  autoRoadAddress: string;
  autoRoadAddressEnglish: string;
  autoJibunAddress: string;
  autoJibunAddressEnglish: string;
  buildingCode: string;
  buildingName: string;
  apartment: 'Y' | 'N';
  sido: string;
  sidoEnglish: string;
  sigungu: string;
  sigunguEnglish: string;
  sigunguCode: string;
  roadnameCode: string;
  bcode: string;
  roadname: string;
  roadnameEnglish: string;
  bname: string;
  bnameEnglish: string;
  bname1: string;
  bname1English: string;
  bname2: string;
  bname2English: string;
  hname: string;
  query: string;
}

// ─── Callbacks ───────────────────────────────

export interface Size {
  width: number;
  height: number;
}

export type CloseState = 'FORCE_CLOSE' | 'COMPLETE_CLOSE';

export interface SearchData {
  q: string;
  count: number;
}

// ─── Theme ───────────────────────────────────

export interface Theme {
  bgColor?: string;
  searchBgColor?: string;
  contentBgColor?: string;
  pageBgColor?: string;
  textColor?: string;
  queryTextColor?: string;
  postcodeTextColor?: string;
  emphTextColor?: string;
  outlineColor?: string;
}

// ─── Postcode Options ────────────────────────

export interface PostcodeOptions {
  oncomplete?: (address: Address) => void;
  onresize?: (size: Size) => void;
  onclose?: (state: CloseState) => void;
  onsearch?: (data: SearchData) => void;
  width?: string | number;
  height?: string | number;
  animation?: boolean;
  focusInput?: boolean;
  autoMapping?: boolean;
  shorthand?: boolean;
  pleaseReadGuide?: number;
  pleaseReadGuideTimer?: number;
  maxSuggestItems?: number;
  showMoreHName?: boolean;
  hideMapBtn?: boolean;
  hideEngBtn?: boolean;
  alwaysShowEngAddr?: boolean;
  submitMode?: boolean;
  useBannerLink?: boolean;
  theme?: Theme;
}

export interface OpenOptions {
  q?: string;
  left?: number | string;
  top?: number | string;
  popupTitle?: string;
  popupKey?: string;
  autoClose?: boolean;
}

export interface EmbedOptions {
  q?: string;
  autoClose?: boolean;
}

// ─── Postcode Instance ───────────────────────

export interface Postcode {
  open(options?: OpenOptions): void;
  embed(element: HTMLElement, options?: EmbedOptions): void;
}

export interface PostcodeConstructor {
  new (options: PostcodeOptions): Postcode;
}

// ─── Loader Config ───────────────────────────

export type LoaderStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface LoaderConfig {
  scriptUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface PostcodeLoader {
  load(): Promise<PostcodeConstructor>;
  getStatus(): LoaderStatus;
  reset(): void;
}

// ─── Window Augmentation ─────────────────────

declare global {
  interface Window {
    kakao?: { Postcode: PostcodeConstructor };
    daum?: { Postcode: PostcodeConstructor };
  }
}
