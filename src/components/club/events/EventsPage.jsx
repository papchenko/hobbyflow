import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../../firebase";
import { useAuth } from "../../../context/AuthContext";

import EventCard from "./EventCard";
import AdminEventForm from "./AdminEventForm";
import ClubNavigation from "../navigation/ClubNavigation";

import "./events.scss";

export default function EventsPage() {
  const { userProfile } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const eventsQuery = query(
      collection(db, "bookClubEvents"),
      where("published", "==", true),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        setEvents(
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })),
        );

        setLoading(false);
      },
      (error) => {
        console.error(
          "Failed to load HobbyFlow events:",
          error,
        );

        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return (
    <main className="club-events-page">
      <div className="club-events-page__container">
        <ClubNavigation />

          {userProfile?.role === "admin" && (
            <AdminEventForm />
          )}

        {loading ? (
          <div className="club-state">
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="club-state">
            No events yet.
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
              />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}