import { useEffect, useState } from "react";
import { db } from "../../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import {
  FaStar,
  FaBookOpen,
  FaCheckCircle,
  FaArrowRight,
  FaHeart,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import "./Takers.scss";

const Takers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // ==========================================
  // FORMAT LAST SEEN
  // ==========================================

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen?.toDate) {
      return "Last seen unknown";
    }

    const lastSeenDate = lastSeen.toDate();
    const now = new Date();

    const diffMs = now - lastSeenDate;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return "Last seen just now";
    }

    if (diffMinutes < 60) {
      return `Last seen ${diffMinutes} ${
        diffMinutes === 1 ? "minute" : "minutes"
      } ago`;
    }

    if (diffHours < 24) {
      return `Last seen ${diffHours} ${
        diffHours === 1 ? "hour" : "hours"
      } ago`;
    }

    if (diffDays === 1) {
      return "Last seen yesterday";
    }

    if (diffDays < 7) {
      return `Last seen ${diffDays} days ago`;
    }

    return `Last seen ${lastSeenDate.toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    )}`;
  };

  // ==========================================
  // FETCH TAKERS
  // ==========================================

  useEffect(() => {
    let unsubscribeUsers = null;

    const fetchUsers = async () => {
      try {
        setLoading(true);

        const usersQuery = query(
          collection(db, "users"),
          where("taker", "==", true)
        );

        // ==========================================
        // REAL-TIME USERS LISTENER
        // ==========================================

        unsubscribeUsers = onSnapshot(
          usersQuery,
          async (snapshot) => {
            try {
              const usersData = await Promise.all(
                snapshot.docs.map(async (docSnap) => {
                  const userData = docSnap.data();

const booksQuery = query(
  collection(db, "books"),
  where("sellerId", "==", docSnap.id)
);

const collectionsQuery = query(
  collection(db, "bookCollections"),
  where("sellerId", "==", docSnap.id)
);

const comicsQuery = query(
  collection(db, "comics"),
  where("sellerId", "==", docSnap.id)
);

const boardGamesQuery = query(
  collection(db, "boardGames"),
  where("sellerId", "==", docSnap.id)
);

const [
  booksSnap,
  collectionsSnap,
  comicsSnap,
  boardGamesSnap,
] = await Promise.all([
  getDocs(booksQuery),
  getDocs(collectionsQuery),
  getDocs(comicsQuery),
  getDocs(boardGamesQuery),
]);

const books = booksSnap.docs.map((bookSnap) => ({
  id: bookSnap.id,
  name: bookSnap.data().name || "Untitled book",
  type: "book",
}));

const collections = collectionsSnap.docs.map(
  (collectionSnap) => ({
    id: collectionSnap.id,
    name:
      collectionSnap.data().collectionName ||
      "Untitled collection",
    type: "collection",
  })
);

const comics = comicsSnap.docs.map((comicSnap) => ({
  id: comicSnap.id,
  name:
    comicSnap.data().name ||
    comicSnap.data().title ||
    "Untitled comic",
  type: "comic",
}));

const boardGames = boardGamesSnap.docs.map(
  (gameSnap) => ({
    id: gameSnap.id,
    name:
      gameSnap.data().name ||
      gameSnap.data().title ||
      "Untitled board game",
    type: "boardGame",
  })
);

const products = [
  ...books,
  ...collections,
  ...comics,
  ...boardGames,
];

return {
  id: docSnap.id,

  name:
    userData.name ||
    userData.username ||
    "Unknown user",

  photoURL:
    userData.photoURL ||
    userData.avatarUrl ||
    null,

  wishlist:
    userData.wishlist || "",

  lastSeen:
    userData.lastSeen || null,

  books: products,

  sellerStats: {
    completedOrders:
      Number(
        userData.sellerStats
          ?.completedOrders
      ) || 0,

    ratingAverage:
      Number(
        userData.sellerStats
          ?.ratingAverage
      ) || 0,

    ratingCount:
      Number(
        userData.sellerStats
          ?.ratingCount
      ) || 0,
  },
};
                })
              );

              setUsers(usersData);
              setLoading(false);
            } catch (error) {
              console.error(
                "Failed to load taker data:",
                error
              );

              setLoading(false);
            }
          },
          (error) => {
            console.error(
              "Failed to listen to takers:",
              error
            );

            setLoading(false);
          }
        );
      } catch (error) {
        console.error(
          "Failed to load takers:",
          error
        );

        setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      if (unsubscribeUsers) {
        unsubscribeUsers();
      }
    };
  }, []);

  // ==========================================
  // FORCE UI UPDATE FOR ONLINE / LAST SEEN
  // ==========================================

  const [, setTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <section className="takers">
        <div className="takers__container">
          <div className="takers__loading">
            <div className="takers__loader" />
            <span>Loading takers...</span>
          </div>
        </div>
      </section>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <section className="takers">
      <div className="takers__container">

        {/* =====================================
            EMPTY
        ====================================== */}

        {users.length === 0 ? (
          <div className="takers__empty">

            <div className="takers__empty-icon">
              <FaBookOpen />
            </div>

            <h3>
              No takers yet
            </h3>

            <p>
              There are currently no active sellers
              available.
            </p>

          </div>
        ) : (

          <div className="takers__grid">

            {users.map((user) => {

              // ==================================
              // ONLINE STATUS
              // ==================================

              const isOnline =
                user.lastSeen?.toDate &&
                Date.now() -
                  user.lastSeen
                    .toDate()
                    .getTime() <
                  60000;

              // ==================================
              // RATING
              // ==================================

              const rating =
                user.sellerStats.ratingCount > 0
                  ? user.sellerStats.ratingAverage
                  : 0;

              return (
                <article
                  key={user.id}
                  className="taker-card"
                  onClick={() =>
                    navigate(
                      `/takers/${user.id}`
                    )
                  }
                >

                  {/* =================================
                      CARD GLOW
                  ================================== */}

                  <div className="taker-card__glow" />

                  {/* =================================
                      TOP
                  ================================== */}

                  <div className="taker-card__top">

                    {/* AVATAR */}

                    <div className="taker-card__avatar-wrapper">

                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.name}
                          className="taker-card__avatar"
                        />
                      ) : (
                        <div className="taker-card__avatar taker-card__avatar--placeholder">
                          {user.name
                            ?.charAt(0)
                            ?.toUpperCase()}
                        </div>
                      )}

                      {isOnline && (
                        <span className="taker-card__online" />
                      )}

                    </div>

                    {/* IDENTITY */}

                    <div className="taker-card__identity">

                      <h2>
                        {user.name}
                      </h2>

                      <span>
                        {isOnline
                          ? "Online"
                          : formatLastSeen(
                              user.lastSeen
                            )}
                      </span>

                    </div>

                    {/* ARROW */}

                    <button
                      type="button"
                      className="taker-card__arrow"
                      aria-label={`Open ${user.name}`}
                      onClick={(e) => {
                        e.stopPropagation();

                        navigate(
                          `/takers/${user.id}`
                        );
                      }}
                    >
                      <FaArrowRight />
                    </button>

                  </div>

                  {/* =================================
                      STATS
                  ================================== */}

                  <div className="taker-card__stats">

                    <div className="taker-stat">

                      <div className="taker-stat__icon">
                        <FaCheckCircle />
                      </div>

                      <div>
                        <strong>
                          {
                            user.sellerStats
                              .completedOrders
                          }
                        </strong>

                        <span>
                          Completed
                        </span>
                      </div>

                    </div>

                    <div className="taker-stat">

                      <div className="taker-stat__icon taker-stat__icon--rating">
                        <FaStar />
                      </div>

                      <div>
                        <strong>
                          {rating.toFixed(1)}
                        </strong>

                        <span>
                          Rating
                        </span>
                      </div>

                    </div>

                    <div className="taker-stat">

                      <div className="taker-stat__icon">
                        <FaBookOpen />
                      </div>

                      <div>
                        <strong>
                          {user.books.length}
                        </strong>

                        <span>
                          Books
                        </span>
                      </div>

                    </div>

                  </div>

                  {/* =================================
                      BOOKS
                  ================================== */}

                  <div className="taker-card__section">

                    <div className="taker-card__section-title">

                      <span>
                        Available listings
                      </span>

                      <span className="taker-card__section-count">
                        {user.books.length}
                      </span>

                    </div>

                    {user.books.length > 0 ? (

                      <div className="taker-card__books">

                        {user.books
                          .slice(0, 4)
                          .map((item) => (
                            <div
                              key={`${item.type}-${item.id}`}
                              className="taker-book"
                            >
                              <FaBookOpen />

                             {item.type === "collection"
                              ? `Collection: ${item.name}`
                              : item.type === "comic"
                              ? `Comic: ${item.name}`
                              : item.type === "boardGame"
                              ? `Board Game: ${item.name}`
                              : item.name}
                            </div>
                          ))}

                        {user.books.length > 4 && (
                          <div className="taker-card__more">
                            +
                            {user.books.length -
                              4}{" "}
                            more
                          </div>
                        )}

                      </div>

                    ) : (

                      <p className="taker-card__muted">
                        No books listed yet.
                      </p>

                    )}

                  </div>

                  {/* =================================
                      WISHLIST
                  ================================== */}

                  {user.wishlist && (

                    <div className="taker-card__wishlist">

                      <div className="taker-card__wishlist-icon">
                        <FaHeart />
                      </div>

                      <div>

                        <span>
                          Wishlist
                        </span>

                        <p>
                          {user.wishlist}
                        </p>

                      </div>

                    </div>

                  )}

                  {/* =================================
                      FOOTER
                  ================================== */}

                  <div className="taker-card__footer">

                    <span>
                      View seller profile
                    </span>

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
};

export default Takers;
