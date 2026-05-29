import React from "react";
import { useState, useEffect, createContext, useContext } from "react";
import {
  auth,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  db,
  doc,
  updateDoc,
  serverTimestamp,
} from "../firebase";
import { createUserProfile, getUserProfile } from "../services/firestore";
import { processReferralOnRegister } from "../components/ReferralSystem";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const [profile, setProfile] = useState(null);

  // دالة الحصول على الدولة من IP
  const getCountryFromIP = async () => {
    try {
      const response = await fetch("https://ipapi.co/json/");
      const data = await response.json();
      return {
        country: data.country_name || "Unknown",
        countryCode: data.country_code || null,
      };
    } catch (err) {
      console.error("Error fetching country:", err);
      return { country: "Unknown", countryCode: null };
    }
  };

  // تحديث lastLogin في Firestore
  const updateLastLogin = async (uid) => {
    try {
      await updateDoc(doc(db, "users", uid), {
        lastLogin: serverTimestamp(),
        lastLoginDate: new Date().toISOString(),
      });
    } catch {}
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const prof = await getUserProfile(firebaseUser.uid);
        setProfile(prof);
        setUser(firebaseUser);
        // تحديث lastLogin عند كل تسجيل دخول
        updateLastLogin(firebaseUser.uid);
      } else {
        setUser(null);
        setProfile(null);
      }
    });
    return unsub;
  }, []);

  const register = async (name, email, password) => {
    const locationData = await getCountryFromIP();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await createUserProfile(cred.user.uid, { 
      name, 
      email,
      country: locationData.country,
      countryCode: locationData.countryCode,
      lastLogin: new Date().toISOString(),
    });

    // #20 Process referral code from URL (?ref=REFXXXXXX)
    const urlParams = new URLSearchParams(window.location.search);
    const refCode   = urlParams.get("ref");
    if (refCode) {
      processReferralOnRegister(cred.user.uid, refCode).catch(() => {});
    }

    const prof = await getUserProfile(cred.user.uid);
    setProfile(prof);
    return cred.user;
  };

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await updateLastLogin(cred.user.uid);
    const prof = await getUserProfile(cred.user.uid);
    setProfile(prof);
    return cred.user;
  };

  const logout = () => signOut(auth);

  const refreshProfile = async () => {
    if (!user?.uid) return null;
    const prof = await getUserProfile(user.uid);
    setProfile(prof);
    return prof;
  };

  const isAdmin = profile?.role === "admin";
  const isLoading = user === undefined;

  return (
    <AuthContext.Provider
      value={{ user, profile, isAdmin, isLoading, register, login, logout, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}