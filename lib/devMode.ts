import type { Phase } from '@/types';

let _devPhaseOverride: Phase | null = null;

export function setDevPhaseOverride(phase: Phase | null): void {
  _devPhaseOverride = phase;
}

export function getDevPhaseOverride(): Phase | null {
  return _devPhaseOverride;
}
