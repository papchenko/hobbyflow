import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  FaArrowRight,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaLock,
} from "react-icons/fa";

import { db } from "../../../../firebase";
import { useAuth } from "../../../../context/AuthContext";

import "./EventsPreview.scss";

export default function EventsPreview() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const eventsQuery = query(
      collection(db, "bookClubEvents"),
      where("published", "==", true)
    );

    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const eventsData = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        eventsData.sort((a, b) => {
          const dateA = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : 0;

          const dateB = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : 0;

          return dateB - dateA;
        });

        setEvents(eventsData.slice(0, 3));
        setLoading(false);
      },
      (error) => {
        console.error(
          "Failed to load HobbyFlow events preview:",
          error
        );

        setEvents([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const formatEventDate = (eventDate) => {
    if (!eventDate?.toDate) {
      return {
        day: "--",
        month: "---",
        year: "",
        time: "--:--",
      };
    }

    const date = eventDate.toDate();

    return {
      day: date.toLocaleDateString("en-GB", {
        day: "2-digit",
      }),

      month: date.toLocaleDateString("en-GB", {
        month: "short",
      }),

      year: date.toLocaleDateString("en-GB", {
        year: "numeric",
      }),

      time: date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const openEvent = (eventId) => {
    navigate(`/club/events/${eventId}`);
  };

  return (
    <section className="events-preview">
      <div className="events-preview__container">

        {/* HEADER */}

        <div className="events-preview__top">
          <div className="events-preview__intro">
            <span className="events-preview__eyebrow">
              HobbyFlow CLUB
            </span>

            <h2>Upcoming events</h2>

            <p>
              Meet other readers, join community activities,
              and discover what is happening at HobbyFlow.
            </p>
          </div>

          {user && (
            <button
              type="button"
              className="events-preview__all"
              onClick={() => navigate("/club/events")}
            >
              <span>Explore events</span>
              <FaArrowRight />
            </button>
          )}
        </div>

        {/* NOT AUTHORIZED */}

        {!user ? (
          <div className="events-preview__locked">
            <div className="events-preview__locked-icon">
              <FaLock />
            </div>

            <div className="events-preview__locked-content">
              <span>HobbyFlow CLUB</span>

              <h3>Log in to discover events</h3>

              <p>
                Sign in to your account to see community events,
                activities and upcoming HobbyFlow gatherings.
              </p>
            </div>
            {/* <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Log in
              <FaArrowRight />
            </button> */}
          </div>
        ) : loading ? (
          <div className="events-preview__loading">
            <FaCalendarAlt />
            <span>Loading events...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="events-preview__empty">
            <FaCalendarAlt />

            <h3>No events yet</h3>

            <p>
              New HobbyFlow community events will appear here.
            </p>
          </div>
        ) : (
          <div className="events-preview__events">

            {events.map((event, index) => {
              const date = formatEventDate(event.eventDate);

              return (
                <article
                  key={event.id}
                  className={`events-preview__event ${
                    index === 0
                      ? "events-preview__event--featured"
                      : ""
                  }`}
                  onClick={() => openEvent(event.id)}
                >
                  {/* DATE */}

                  <div className="events-preview__date">
                    <span className="events-preview__date-day">
                      {date.day}
                    </span>

                    <span className="events-preview__date-month">
                      {date.month}
                    </span>

                    <span className="events-preview__date-year">
                      {date.year}
                    </span>
                  </div>

                  {/* CONTENT */}

                  <div className="events-preview__event-content">

                    <div className="events-preview__event-type">
                      <FaCalendarAlt />
                      <span>HobbyFlow EVENT</span>
                    </div>

                    <h3>{event.title}</h3>

                    {event.subtitle && (
                      <p className="events-preview__subtitle">
                        {event.subtitle}
                      </p>
                    )}

                    {event.description && (
                      <p className="events-preview__description">
                        {event.description}
                      </p>
                    )}

                    <div className="events-preview__meta">

                      {event.eventDate?.toDate && (
                        <span>
                          <FaClock />
                          {date.time}
                        </span>
                      )}

                      {event.location && (
                        <span>
                          <FaMapMarkerAlt />
                          {event.location}
                        </span>
                      )}

                      <span>
                        <FaUsers />
                        {event.interestedUsers?.length || 0}
                      </span>

                    </div>
                  </div>

                  {/* ARROW */}

                  <div className="events-preview__event-arrow">
                    <FaArrowRight />
                  </div>
                </article>
              );
            })}

          </div>
        )}
      </div>
    </section>
  );
}