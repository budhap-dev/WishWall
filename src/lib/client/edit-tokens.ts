"use client";

import { useSyncExternalStore } from "react";

/**
 * Guests prove they wrote a message with a random token issued when they
 * posted. It lives only in this browser (localStorage), keyed by message id.
 * Clearing site data or switching device loses it; that's the trade-off for
 * posting without an account.
 */

type TokenEntry = { token: string; boardId: string };
type TokenMap = Record<string, TokenEntry>;

const STORAGE_KEY = "wishwall:edit-tokens";
const EMPTY: TokenMap = {};
const listeners = new Set<() => void>();
let cache: { raw: string | null; map: TokenMap } | null = null;

function read(): TokenMap {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return EMPTY; // storage blocked (private mode, etc.)
  }
  if (cache?.raw === raw) return cache.map; // stable snapshot for useSyncExternalStore
  let map: TokenMap = EMPTY;
  try {
    map = raw ? (JSON.parse(raw) as TokenMap) : EMPTY;
  } catch {
    map = EMPTY;
  }
  cache = { raw, map };
  return map;
}

function write(map: TokenMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Can't persist; the guest just won't be able to edit later.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && listener();
  window.addEventListener("storage", onStorage); // other tabs
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function saveEditToken(
  messageId: string,
  boardId: string,
  token: string,
) {
  write({ ...read(), [messageId]: { token, boardId } });
}

export function forgetEditToken(messageId: string) {
  const next = { ...read() };
  delete next[messageId];
  write(next);
}

export function getEditToken(messageId: string): string | null {
  return read()[messageId]?.token ?? null;
}

/** All of this browser's edit tokens (empty during server render). */
export function useEditTokens(): TokenMap {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function tokensForBoard(map: TokenMap, boardId: string): string[] {
  return Object.values(map)
    .filter((e) => e.boardId === boardId)
    .map((e) => e.token);
}

// Remember a guest's display name between posts.
const NAME_KEY = "wishwall:guest-name";
export function loadGuestName(): string {
  try {
    return window.localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}
export function saveGuestName(name: string) {
  try {
    window.localStorage.setItem(NAME_KEY, name);
  } catch {
    // ignore
  }
}
