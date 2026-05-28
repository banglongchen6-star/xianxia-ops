"use client";
import { useState, useEffect, useCallback } from "react";
import { sessionStore, seedDemo } from "./store";
import { Session } from "./types";

// 订阅 localStorage 变化，任何 store 写入都会触发组件刷新
export function useOps() {
  const [version, setVersion] = useState(0);
  const [session, setSessionState] = useState<Session>({ role: "company", partnerId: null });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDemo();
    setSessionState(sessionStore.get());
    setReady(true);
    const handler = () => setVersion(v => v + 1);
    window.addEventListener("ops-store-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("ops-store-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const refresh = useCallback(() => setVersion(v => v + 1), []);

  const setSession = useCallback((s: Session) => {
    sessionStore.set(s);
    setSessionState(s);
  }, []);

  return { version, session, setSession, refresh, ready };
}
