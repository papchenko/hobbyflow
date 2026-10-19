import { useEffect, useState } from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import { FaCheckCircle } from "react-icons/fa";

import { db } from "../../../firebase";

export default function MessageItem({
  message,
}) {
  const [profile, setProfile] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!message?.uid) {
      return;
    }

    async function loadProfile() {
      try {
        const userRef = doc(
          db,
          "users",
          message.uid,
        );

        const snapshot = await getDoc(userRef);

        if (snapshot.exists()) {
          setProfile(snapshot.data());
        }
      } catch (error) {
        console.error(
          "Failed to load profile:",
          error,
        );
      }
    }

    loadProfile();
  }, [message?.uid]);

  const username =
    profile?.name ||
    message?.username ||
    "User";

  const avatar =
    profile?.photoURL ||
    message?.avatar ||
    "";

  const isPremium =
    profile?.taker === true ||
    message?.isPremium === true;

  const letter =
    Array.from(username)[0] || "?";

  const time =
    message.createdAt?.toDate
      ? message.createdAt
          .toDate()
          .toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
      : "";

  return (
    <article className="message-item">
      <div className="message-item__avatar-wrap">

        <div className="message-item__avatar">
          {avatar && !imageError ? (
            <img
              src={avatar}
              alt={username}
              onError={() =>
                setImageError(true)
              }
            />
          ) : (
            <span>
              {letter.toUpperCase()}
            </span>
          )}
        </div>

        {/* {isPremium && (
          <FaCheckCircle className="message-item__premium" />
        )} */}

      </div>

      <div className="message-item__body">

        <div className="message-item__header">

          <strong>
            {username}
          </strong>

          <span>
            {time}
          </span>

        </div>

        <p>
          {message.text}
        </p>

      </div>
    </article>
  );
}