# Headless Architecture Design

## Architecture

```
Thin Components (Postcode, PostcodePopup)
  └─ useKakaoPostcode (headless core hook)
       └─ createPostcodeLoader (pure script loader)
            └─ types (Address, Theme, PostcodeOptions...)
```

## Layers

### 1. Script Loader (`loader/createPostcodeLoader.ts`)
- Factory pattern (not IIFE singleton)
- timeout, retry, dedup
- Status: idle → loading → ready | error
- React-independent

### 2. Headless Hook (`useKakaoPostcode.ts`)
- Single hook for both embed and popup modes
- Returns: status, error, open(), embed(), close(), embedRef
- embedRef: callback ref for auto-embed on mount
- All business logic lives here

### 3. Thin Components
- `Postcode`: embed wrapper (~10 lines), uses embedRef
- `PostcodePopup`: popup wrapper (~15 lines), children or render prop

## File Structure

```
src/
├── loader/
│   ├── createPostcodeLoader.ts
│   └── types.ts
├── useKakaoPostcode.ts
├── Postcode.tsx
├── PostcodePopup.tsx
└── index.ts
```

## Public API

```typescript
export { useKakaoPostcode } from './useKakaoPostcode';
export { default as Postcode } from './Postcode';
export { default as PostcodePopup } from './PostcodePopup';
export { createPostcodeLoader } from './loader/createPostcodeLoader';
export type { Address, Theme, ... } from './loader/types';
```
