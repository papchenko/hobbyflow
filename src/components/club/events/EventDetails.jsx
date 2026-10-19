import { useEffect, useState } from "react";

import {
  doc,
  deleteDoc,
  getDoc,
  increment,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

import {
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaPen,
  FaTrash,
  FaUsers,
  FaTimes,
} from "react-icons/fa";

import { toast } from "react-toastify";

import { db } from "../../../firebase";
import { useAuth } from "../../../context/AuthContext";

import EventInterestButton from "./EventInterestButton";
import EventShareButton from "./EventShareButton";
import EditEventForm from "./EditEventForm";

function formatDate(timestamp) {
  if (!timestamp?.toDate) {
    return null;
  }

  return timestamp.toDate().toLocaleString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const { userProfile } = useAuth();

  const [event, setEvent] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [editing, setEditing] =
    useState(false);

    const [participantsOpen, setParticipantsOpen] =
  useState(false);

const [participants, setParticipants] =
  useState([]);

const [participantsLoading, setParticipantsLoading] =
  useState(false);

  const isAdmin =
    userProfile?.role === "admin";

  useEffect(() => {
    if (!eventId) {
      return undefined;
    }

    const eventRef = doc(
      db,
      "bookClubEvents",
      eventId,
    );

    let viewCounted = false;

    const unsubscribe = onSnapshot(
      eventRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          setEvent(null);
          setLoading(false);
          return;
        }

        const data = {
          id: snapshot.id,
          ...snapshot.data(),
        };

        setEvent(data);
        setLoading(false);

        if (!viewCounted) {
          viewCounted = true;

          try {
            await updateDoc(
              eventRef,
              {
                views: increment(1),
              },
            );
          } catch (error) {
            console.error(
              "Failed to update event views:",
              error,
            );
          }
        }
      },
      (error) => {
        console.error(
          "Failed to load event:",
          error,
        );

        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [eventId]);

  async function handleOpenParticipants() {
  setParticipantsOpen(true);
  setParticipantsLoading(true);

  try {
    const userIds = Array.isArray(event?.interestedUsers)
      ? event.interestedUsers
      : [];

    const users = await Promise.all(
      userIds.map(async (uid) => {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          return {
            id: uid,
            name: "Unknown user",
            photoURL: "",
          };
        }

        const data = userSnap.data();

        return {
          id: uid,
          name: data.name || data.displayName || "User",
          photoURL: data.photoURL || "",
          email: data.email || "",
        };
      }),
    );

    setParticipants(users);
  } catch (error) {
    console.error(
      "Failed to load event participants:",
      error,
    );

    toast.error("Failed to load participants.");
  } finally {
    setParticipantsLoading(false);
  }
}

  if (loading) {
    return (
      <main className="event-details">
        <div className="club-state">
          Loading event...
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="event-details">
        <div className="club-state">
          <h2>Event not found</h2>

          <Link to="/club/events">
            <FaArrowLeft />
            Back to events
          </Link>
        </div>
      </main>
    );
  }

  async function handleDelete() {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${event.title}"? This action cannot be undone.`,
      );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(
        doc(
          db,
          "bookClubEvents",
          event.id,
        ),
      );

      toast.success(
        "Event deleted successfully.",
      );

      navigate("/club/events");
    } catch (error) {
      console.error(
        "Failed to delete event:",
        error,
      );

      toast.error(
        "Failed to delete the event.",
      );
    }
  }

  if (editing) {
    return (
      <main className="event-details">
        <div className="event-details__container">
          <EditEventForm
            eventId={event.id}
            onClose={() =>
              setEditing(false)
            }
          />
        </div>
      </main>
    );
  }

  return (
    <main className="event-details">
      <div className="event-details__container">
        <Link
          to="/club/events"
          className="event-details__back"
        >
          <FaArrowLeft />
          Back to events
        </Link>

        {isAdmin && (
          <div className="event-details__admin">
            <button
              type="button"
              className="event-details__edit"
              onClick={() =>
                setEditing(true)
              }
            >
              <FaPen />
              Edit event
            </button>

            <button
              type="button"
              className="event-details__delete"
              onClick={handleDelete}
            >
              <FaTrash />
              Delete event
            </button>
          </div>
        )}

        <article className="event-details__article">
          <span className="event-details__label">
            HobbyFlow EVENT
          </span>

          <h1>{event.title}</h1>

          {event.subtitle && (
            <p className="event-details__subtitle">
              {event.subtitle}
            </p>
          )}

          <div className="event-details__meta">
            {event.eventDate && (
              <span>
                <FaCalendarAlt />
                {formatDate(
                  event.eventDate,
                )}
              </span>
            )}

            {event.location && (
              <span>
                <FaMapMarkerAlt />
                {event.location}
              </span>
            )}

            <span>
              {event.views || 0} views
            </span>
          </div>

          {event.updatedAt?.toDate && (
            <div className="event-details__edited">
              Edited{" "}
              {formatDate(
                event.updatedAt,
              )}

              {event.updatedByName && (
                <>
                  {" "}
                  by{" "}
                  {event.updatedByName}
                </>
              )}
            </div>
          )}


<div className="event-details__actions">
  <EventInterestButton
    event={event}
    onChange={(data) =>
      setEvent((prev) => ({
        ...prev,
        ...data,
      }))
    }
  />

  <button
    type="button"
    className="event-participants-button"
    onClick={handleOpenParticipants}
  >
    <FaUsers />
    <span>Participants</span>
    <strong>
      {event.interestedUsers?.length || 0}
    </strong>
  </button>

  <EventShareButton event={event} />
</div>


          {event.description && (
            <div className="event-details__content">
              {event.description}
            </div>
          )}

          <div className="event-details__author">
            Published by{" "}
            <strong>
              {event.authorName ||
                "HobbyFlow Team"}
            </strong>
          </div>
        </article>

{participantsOpen && (
  <div
    className="event-participants-overlay"
    onClick={() => setParticipantsOpen(false)}
  >
    <section
      className="event-participants-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="event-participants-modal__header">
        <div>
          <h3>Event participants</h3>
          <p>
            {event.interestedUsers?.length || 0} people joining
          </p>
        </div>

        <button
          type="button"
          onClick={() => setParticipantsOpen(false)}
          aria-label="Close participants"
          className="close-participant"
        >
          <FaTimes />
        </button>
      </div>

      <div className="event-participants-modal__list">
        {participantsLoading ? (
          <div className="club-state">
            Loading participants...
          </div>
        ) : participants.length === 0 ? (
          <div className="club-state">
            Nobody has joined this event yet.
          </div>
        ) : (

participants.map((participant) => (
  <div
    className="event-participant event-participant--clickable"
    key={participant.id}
    role="button"
    tabIndex={0}
    onClick={() => {
      setParticipantsOpen(false);
      navigate(`/takers/${participant.id}`);
    }}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setParticipantsOpen(false);
        navigate(`/takers/${participant.id}`);
      }
    }}
  >
    {participant.photoURL ? (
      <img
        src={participant.photoURL}
        alt={participant.name}
        className="event-participant__avatar"
      />
    ) : (
      <div className="event-participant__avatar event-participant__avatar--placeholder">
        {(participant.name || "U")
          .charAt(0)
          .toUpperCase()}
      </div>
    )}

    <div className="event-participant__info">
      <strong>{participant.name}</strong>

      {participant.email && (
        <span>{participant.email}</span>
      )}
    </div>

    <FaUsers className="event-participant__icon" />
  </div>
))

        )}
      </div>
    </section>
  </div>
)}

      </div>
    </main>
  );
}