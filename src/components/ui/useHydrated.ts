"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/**
 * False in the server HTML and until hydration, true afterwards. A control
 * that only works through React state stays disabled until then, so it
 * never looks usable while it cannot react (no JavaScript, slow network).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
}
