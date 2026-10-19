import { useState } from "react";
import {
  arrayRemove,
  arrayUnion,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  FaCheck,
  FaRegCalendarCheck,
} from "react-icons/fa";
import { toast } from "react-toastify";

import { db } from "../../../firebase";
import { useAuth } from "../../../context/AuthContext";

export default function EventInterestButton({
  event,
  onChange,
}) {
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);

  const interestedUsers =
    event?.interestedUsers || [];

  const isInterested =
    Boolean(
      user?.uid &&
      interestedUsers.includes(user.uid),
    );

  async function handleClick() {
    if (!user?.uid || loading) {
      if (!user) {
        toast.info(
          "Sign in to join this event.",
        );
      }

      return;
    }

    try {
      setLoading(true);

      const eventRef = doc(
        db,
        "bookClubEvents",
        event.id,
      );

      if (isInterested) {
        await updateDoc(eventRef, {
          interestedUsers:
            arrayRemove(user.uid),
        });

        onChange?.({
          interestedUsers:
            interestedUsers.filter(
              (id) => id !== user.uid,
            ),
        });
      } else {
        await updateDoc(eventRef, {
          interestedUsers:
            arrayUnion(user.uid),
        });

        onChange?.({
          interestedUsers: [
            ...interestedUsers,
            user.uid,
          ],
        });
      }
    } catch (error) {
      console.error(
        "Failed to update event interest:",
        error,
      );

      toast.error(
        "Could not update your event status.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={`event-interest ${
        isInterested ? "active" : ""
      }`}
      onClick={handleClick}
      disabled={loading}
    >
      {isInterested ? (
        <FaCheck />
      ) : (
        <FaRegCalendarCheck />
      )}

      <span>
        {isInterested
          ? "You're joining"
          : "I'll be joining"}
      </span>

      <strong>
        {interestedUsers.length}
      </strong>
    </button>
  );
}