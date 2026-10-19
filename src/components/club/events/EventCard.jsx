import { useState } from "react";

import { Link } from "react-router-dom";

import {
  FaCalendarAlt,
  FaArrowRight,
  FaMapMarkerAlt,
  FaPen,
  FaTrash,
} from "react-icons/fa";

import {
  deleteDoc,
  doc,
} from "firebase/firestore";

import { toast } from "react-toastify";

import EventShareButton from "./EventShareButton";
import EditEventForm from "./EditEventForm";

import { db } from "../../../firebase";
import { useAuth } from "../../../context/AuthContext";

function formatDate(event) {
  const date = event.eventDate?.toDate
    ? event.eventDate.toDate()
    : event.createdAt?.toDate
      ? event.createdAt.toDate()
      : null;

  if (!date) {
    return "Date not set";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

export default function EventCard({
  event,
}) {
  const { userProfile } = useAuth();

  const [editing, setEditing] =
    useState(false);

  const isAdmin =
    userProfile?.role === "admin";

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
      <EditEventForm
        eventId={event.id}
        onClose={() =>
          setEditing(false)
        }
      />
    );
  }

  return (
    <article className="event-card">
      <Link
        to={`/club/events/${event.id}`}
        className="event-card__link"
      >
        <div className="event-card__icon">
          <FaCalendarAlt />
        </div>

        <span className="event-card__label">
          HobbyFlow EVENT
        </span>

        <h2>{event.title}</h2>

        {event.subtitle && (
          <p className="event-card__subtitle">
            {event.subtitle}
          </p>
        )}

        {event.description && (
          <p className="event-card__description">
            {event.description}
          </p>
        )}

        <div className="event-card__footer">
          <span>
            {formatDate(event)}
          </span>

          <span>
            {event.interestedUsers
              ?.length || 0}{" "}
            joining
          </span>
        </div>

        {event.location && (
          <div className="event-card__location">
            <FaMapMarkerAlt />
            {event.location}
          </div>
        )}

        <div className="event-card__read">
          View event
          {/* <FaArrowRight /> */}
        </div>
      </Link>

      {isAdmin && (
        <div className="event-card__admin-actions">
          <button
            type="button"
            className="event-card__edit"
            onClick={() =>
              setEditing(true)
            }
          >
            <FaPen />
            Edit
          </button>

          <button
            type="button"
            className="event-card__delete"
            onClick={handleDelete}
          >
            <FaTrash />
            Delete
          </button>
        </div>
      )}

      {!isAdmin && (
        <div className="event-card__actions">
          <EventShareButton
            event={event}
          />
        </div>
      )}

      {isAdmin && (
        <div className="event-card__share">
          <EventShareButton
            event={event}
          />
        </div>
      )}
    </article>
  );
}