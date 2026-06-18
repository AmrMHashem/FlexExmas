// hooks/useAuth.js — FlexExams v5.0
// ✅ Auth context with memory-cached profile
// ✅ No repeated Firestore reads on re-render
// ✅ Profile cached in ref — only re-fetched on explicit refreshProfile() call
// ✅ No onAuthStateChanged re-triggering profile fetch unnecessarily

import React, {
  createContext, useContext, useState, useEffect, useRef, useCallback,
} from "react";
import {
  auth,
  db,
  onAuthStateChanged,
  signOut,
} from "../firebase";
import {
  doc, getDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
// في signIn handler أو onAuthStateChanged
import { updateLastLogin } from "../firebase";
// بعد نجاح signIn
await updateLastLogin(user.uid);

// ── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ── Profile cache — module-level, survives re-renders, clears on sign-out ───
const _profileCache = { uid: null, data: null, ts: 0 };
const PROFILE_TTL = 5 * 60 * 1000; // 5 min

function getCachedProfile(uid) {
  if (_profileCache.uid === uid && _profileCache.data && Date.now() - _profileCache.ts < PROFILE_TTL) {
    return _profileCache.data;
  }
  return null;
}
function setCachedProfile(uid, data) {
  _profileCache.uid  = uid;
  _profileCache.data = data;
  _profileCache.ts   = Date.now();
  return data;
}
function clearProfileCache() {
  _profileCache.uid  = null;
  _profileCache.data = null;
  _profileCache.ts   = 0;
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [profile, setProfile]   = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const profileFetchRef         = useRef(null); // deduplication — one in-flight fetch at a time

  // Fetch profile — deduped, cached
  const fetchProfile = useCallback(async (uid, force = false) => {
    if (!uid) return null;

    // Return from cache unless forced
    if (!force) {
      const cached = getCachedProfile(uid);
      if (cached) { setProfile(cached); return cached; }
    }

    // Deduplicate in-flight fetches
    if (profileFetchRef.current) return profileFetchRef.current;

    profileFetchRef.current = (async () => {
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setCachedProfile(uid, data);
          setProfile(data);
          return data;
        }
        return null;
      } catch (err) {
        console.error("[useAuth] fetchProfile error:", err);
        return null;
      } finally {
        profileFetchRef.current = null;
      }
    })();

    return profileFetchRef.current;
  }, []);

  // Explicit refresh — forces re-fetch and clears cache
  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) return;
    clearProfileCache();
    return fetchProfile(auth.currentUser.uid, true);
  }, [fetchProfile]);

  // Auth state listener — runs ONCE, profile fetch is cached
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Try cache first — avoids a read on every hot-reload / page focus
        const cached = getCachedProfile(firebaseUser.uid);
        if (cached) {
          setProfile(cached);
          setIsLoading(false);
        } else {
          setIsLoading(true);
          await fetchProfile(firebaseUser.uid);
          setIsLoading(false);
        }
      } else {
        setUser(null);
        setProfile(null);
        clearProfileCache();
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, [fetchProfile]);

  // ── register ────────────────────────────────────────────────────────────────
  const register = useCallback(async (email, password, name, country = "Unknown", countryCode = null) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    const profileData = {
      uid: cred.user.uid,
      name,
      email,
      role: "student",
      country,
      countryCode,
      createdAt: serverTimestamp(),
      favorites: [],
      enrolledExams: [],
      stats: { totalAttempts: 0, totalPassed: 0, averageScore: 0 },
    };
    await setDoc(doc(db, "users", cred.user.uid), profileData);
    setCachedProfile(cred.user.uid, { id: cred.user.uid, ...profileData });
    return cred;
  }, []);

  // ── login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Profile will be fetched by onAuthStateChanged if not cached
    return cred;
  }, []);

  // ── logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    clearProfileCache();
    // Clear MyExams & Dashboard caches on logout
    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("fx_")) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => sessionStorage.removeItem(k));
    } catch { /* ignore */ }
    await signOut(auth);
  }, []);

  // ── derived ──────────────────────────────────────────────────────────────────
  const isAdmin = profile?.role === "admin";

  const value = {
    user,
    profile,
    isLoading,
    isAdmin,
    login,
    register,
    logout,
    refreshProfile,
    fetchProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
