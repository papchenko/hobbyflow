import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export const useUnreadSupport = () => {
  const { userProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (userProfile?.role !== "admin") {
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, "supportMessages"),
      where("senderRole", "==", "user"),
      where("adminRead", "==", false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnreadCount(snapshot.size);
      },
      (error) => {
        console.error("Support notifications:", error);
      }
    );

    return () => unsubscribe();
  }, [userProfile?.role]);

  return unreadCount;
};