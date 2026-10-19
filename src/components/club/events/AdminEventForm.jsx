import { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  FaCalendarPlus,
  FaTimes,
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

export default function AdminEventForm() {
  const { user, userProfile } = useAuth();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  const isAdmin = userProfile?.role === "admin";

  if (!isAdmin) {
    return null;
  }

  function handleChange(event) {
    const { name, value } = event.target;

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
      toast.error("Please enter an event title.");
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

      await addDoc(
        collection(db, "bookClubEvents"),
        {
          title,

          subtitle:
            form.subtitle.trim(),

          description:
            form.description.trim(),

          location:
            form.location.trim(),

          eventDate,

          authorId: user.uid,

          authorName:
            userProfile?.name ||
            user.displayName ||
            "HobbyFlow Team",

          published: true,

          interestedUsers: [],

          views: 0,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),
        },
      );

      setForm(INITIAL_FORM);
      setOpen(false);

      toast.success("Event published.");
    } catch (error) {
      console.error(
        "Failed to create event:",
        error,
      );

      toast.error(
        "Failed to create the event.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <section className="admin-publisher">
        <div className="admin-publisher__info">
          <span>ADMIN</span>

          <div>
            <h2>Create event</h2>

            <p>
              Create a new HobbyFlow community event.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="admin-publisher__toggle"
          onClick={() => setOpen(true)}
        >
          {/* <FaCalendarPlus /> */}

          <span>New event</span>
        </button>
      </section>
    );
  }

  return (
    <section className="admin-publisher admin-publisher--open">
      <div className="admin-publisher__top">
        <div>
          <span>ADMIN</span>

          <h2>Create event</h2>

          <p>
            Publish a new HobbyFlow Club event.
          </p>
        </div>

        <button
          type="button"
          className="admin-publisher__close"
          onClick={() => setOpen(false)}
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
            <label htmlFor="event-title">
              Title
            </label>

            <input
              id="event-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Event title"
              maxLength={160}
              required
            />
          </div>

          <div className="admin-event-form__field">
            <label htmlFor="event-date">
              Date and time
            </label>

            <input
              id="event-date"
              name="eventDate"
              type="datetime-local"
              value={form.eventDate}
              onChange={handleChange}
            />
          </div>

          <div className="admin-event-form__field">
            <label htmlFor="event-location">
              Location
            </label>

            <input
              id="event-location"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Online / Kyiv / HobbyFlow..."
            />
          </div>

          <div className="admin-event-form__field admin-event-form__field--full">
            <label htmlFor="event-subtitle">
              Subtitle
            </label>

            <input
              id="event-subtitle"
              name="subtitle"
              value={form.subtitle}
              onChange={handleChange}
              placeholder="Short event description"
              maxLength={250}
            />
          </div>

          <div className="admin-event-form__field admin-event-form__field--full">
            <label htmlFor="event-description">
              Description
            </label>

            <textarea
              id="event-description"
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
            onClick={() => setOpen(false)}
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
            {saving
              ? "Publishing..."
              : "Publish event"}
          </button>
        </div>
      </form>
    </section>
  );
}