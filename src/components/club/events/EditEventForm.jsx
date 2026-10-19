import { useEffect, useState } from "react";

import {
  doc,
  getDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import {
  FaTimes,
  FaSave,
} from "react-icons/fa";

import { toast } from "react-toastify";

import { db } from "../../../firebase";
import { useAuth } from "../../../context/AuthContext";

const INITIAL_FORM = {
  title: "",
  subtitle: "",
  description: "",
  eventDate: "",
  location: "",
};

function formatDateTimeLocal(timestamp) {
  if (!timestamp?.toDate) {
    return "";
  }

  const date = timestamp.toDate();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(
    date.getDate(),
  ).padStart(2, "0");
  const hours = String(
    date.getHours(),
  ).padStart(2, "0");
  const minutes = String(
    date.getMinutes(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function EditEventForm({
  eventId,
  onClose,
  onSaved,
}) {
  const { user, userProfile } = useAuth();

  const [form, setForm] =
    useState(INITIAL_FORM);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const isAdmin =
    userProfile?.role === "admin";

  useEffect(() => {
    async function loadEvent() {
      if (!eventId) {
        return;
      }

      try {
        const eventRef = doc(
          db,
          "bookClubEvents",
          eventId,
        );

        const snapshot =
          await getDoc(eventRef);

        if (!snapshot.exists()) {
          toast.error("Event not found.");
          return;
        }

        const data = snapshot.data();

        setForm({
          title: data.title || "",
          subtitle: data.subtitle || "",
          description:
            data.description || "",
          eventDate:
            formatDateTimeLocal(
              data.eventDate,
            ),
          location:
            data.location || "",
        });
      } catch (error) {
        console.error(
          "Failed to load event:",
          error,
        );

        toast.error(
          "Failed to load the event.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (isAdmin) {
      loadEvent();
    }
  }, [eventId, isAdmin]);

  if (!isAdmin) {
    return null;
  }

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isAdmin || saving) {
      return;
    }

    const title = form.title.trim();

    if (!title) {
      toast.error(
        "Please enter an event title.",
      );
      return;
    }

    try {
      setSaving(true);

      let eventDate = null;

      if (form.eventDate) {
        eventDate = Timestamp.fromDate(
          new Date(form.eventDate),
        );
      }

      const eventRef = doc(
        db,
        "bookClubEvents",
        eventId,
      );

      await updateDoc(eventRef, {
        title,

        subtitle:
          form.subtitle.trim(),

        description:
          form.description.trim(),

        location:
          form.location.trim(),

        eventDate,

        updatedAt:
          Timestamp.now(),

        updatedById: user.uid,

        updatedByName:
          userProfile?.name ||
          user.displayName ||
          "HobbyFlow Team",
      });

      toast.success(
        "Event updated successfully.",
      );

      if (onSaved) {
        onSaved();
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error(
        "Failed to update event:",
        error,
      );

      toast.error(
        "Failed to update the event.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="admin-publisher admin-publisher--open">
        <div className="club-state">
          Loading event...
        </div>
      </section>
    );
  }

  return (
    <section className="admin-publisher admin-publisher--open">
      <div className="admin-publisher__top">
        <div>
          <span>ADMIN</span>

          <h2>Edit event</h2>

          <p>
            Update this HobbyFlow Club
            event.
          </p>
        </div>

        <button
          type="button"
          className="admin-publisher__close"
          onClick={onClose}
          disabled={saving}
          aria-label="Close form"
        >
          <FaTimes />
        </button>
      </div>

      <form
        className="admin-event-form"
        onSubmit={handleSubmit}
      >
        <div className="admin-event-form__grid">
          <div className="admin-event-form__field admin-event-form__field--full">
            <label htmlFor="edit-event-title">
              Title
            </label>

            <input
              id="edit-event-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Event title"
              maxLength={160}
              required
            />
          </div>

          <div className="admin-event-form__field">
            <label htmlFor="edit-event-date">
              Date and time
            </label>

            <input
              id="edit-event-date"
              name="eventDate"
              type="datetime-local"
              value={form.eventDate}
              onChange={handleChange}
            />
          </div>

          <div className="admin-event-form__field">
            <label htmlFor="edit-event-location">
              Location
            </label>

            <input
              id="edit-event-location"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Online / Kyiv / HobbyFlow..."
            />
          </div>

          <div className="admin-event-form__field admin-event-form__field--full">
            <label htmlFor="edit-event-subtitle">
              Subtitle
            </label>

            <input
              id="edit-event-subtitle"
              name="subtitle"
              value={form.subtitle}
              onChange={handleChange}
              placeholder="Short event description"
              maxLength={250}
            />
          </div>

          <div className="admin-event-form__field admin-event-form__field--full">
            <label htmlFor="edit-event-description">
              Description
            </label>

            <textarea
              id="edit-event-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the event..."
              rows={9}
            />
          </div>
        </div>

        <div className="admin-event-form__actions">
          <button
            type="button"
            className="admin-event-form__cancel"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="admin-event-form__submit"
            disabled={
              saving ||
              !form.title.trim()
            }
          >
            <FaSave />

            {saving
              ? "Saving..."
              : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}