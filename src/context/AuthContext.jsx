import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (firebaseUser) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data();

      if (data.premiumUntil?.toDate) {
        const expiry = data.premiumUntil.toDate();

        if (expiry < new Date() && data.taker === true) {
          await updateDoc(userRef, {
            taker: false,
            premiumUntil: null,
          });

          data.taker = false;
          data.premiumUntil = null;
        }
      }

      setUserProfile(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    let heartbeatInterval = null;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          setUser(firebaseUser);

          const userRef = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(userRef);

          if (!snap.exists()) {
            await setDoc(userRef, {
              name: firebaseUser.displayName || "",
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL || "",
              taker: false,
              premiumUntil: null,
              lastAvatarChange: null,
              lastNicknameChange: null,
              role: "user",
              createdAt: serverTimestamp(),
              lastSeen: serverTimestamp(),
            });
          } else {
            await updateDoc(userRef, {
              lastSeen: serverTimestamp(),
            });
          }

          await fetchUserProfile(firebaseUser);

          // Оновлюємо lastSeen кожні 30 секунд
          heartbeatInterval = setInterval(async () => {
            try {
              await updateDoc(userRef, {
                lastSeen: serverTimestamp(),
              });
            } catch (error) {
              console.error(
                "Failed to update online status:",
                error
              );
            }
          }, 30000);
        } else {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      unsubscribe();

      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
      }
    };
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const register = async (email, password, name) => {
    const res = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const userRef = doc(db, "users", res.user.uid);

    await setDoc(userRef, {
      name: name,
      email: email,
      photoURL: "",
      taker: false,
      premiumUntil: null,
      lastAvatarChange: null,
      lastNicknameChange: null,
      role: "user",
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });

    return res;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();

    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        name: firebaseUser.displayName || "",
        email: firebaseUser.email,
        photoURL: firebaseUser.photoURL || "",
        taker: false,
        premiumUntil: null,
        lastAvatarChange: null,
        lastNicknameChange: null,
        role: "user",
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        lastSeen: serverTimestamp(),
      });
    }

    return firebaseUser;
  };

  const logout = () => signOut(auth);

  const refreshUser = async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        login,
        register,
        logout,
        refreshUser,
        loginWithGoogle,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};