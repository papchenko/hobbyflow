import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDocs,
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import {
  FaArrowLeft,
  FaBookOpen,
  FaCheckCircle,
  FaHeart,
  FaStar,
  FaUser,
} from "react-icons/fa";
import { db } from "../../../firebase";

import "./TakerDetails.scss";

const TakerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [seller, setSeller] = useState(null);
  const [books, setBooks] = useState([]);
  const [collections, setCollections] = useState([]);
  const [comics, setComics] = useState([]);
  const [boardGames, setBoardGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    const sellerRef = doc(db, "users", id);

    // ==========================================
    // SELLER REAL-TIME LISTENER
    // ==========================================

    const unsubscribeSeller = onSnapshot(
      sellerRef,
      (sellerSnap) => {
        if (sellerSnap.exists()) {
          const sellerData = sellerSnap.data();

          setSeller(sellerData);

          // Перевіряємо online статус
          const lastSeen = sellerData.lastSeen;

          if (lastSeen?.toDate) {
            const lastSeenTime =
              lastSeen.toDate().getTime();

            const now = Date.now();

            setIsOnline(
              now - lastSeenTime < 60000
            );
          } else {
            setIsOnline(false);
          }
        } else {
          setSeller(null);
          setIsOnline(false);
        }

        setLoading(false);
      },
      (error) => {
        console.error(
          "Failed to listen to seller:",
          error
        );

        setSeller(null);
        setIsOnline(false);
        setLoading(false);
      }
    );

    // ==========================================
    // BOOKS
    // ==========================================

    const fetchSellerProducts = async () => {
try {
  const [
    booksSnap,
    collectionsSnap,
    comicsSnap,
    boardGamesSnap,
  ] = await Promise.all([
    getDocs(
      query(
        collection(db, "books"),
        where("sellerId", "==", id)
      )
    ),
    getDocs(
      query(
        collection(db, "bookCollections"),
        where("sellerId", "==", id)
      )
    ),
    getDocs(
      query(
        collection(db, "comics"),
        where("sellerId", "==", id)
      )
    ),
    getDocs(
      query(
        collection(db, "boardGames"),
        where("sellerId", "==", id)
      )
    ),
  ]);

  setBooks(
    booksSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }))
  );

  setCollections(
    collectionsSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }))
  );

  setComics(
    comicsSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }))
  );

  setBoardGames(
    boardGamesSnap.docs.map((item) => ({
      id: item.id,
      ...item.data(),
    }))
  );
} catch (error) {
    console.error(
      "Failed to fetch seller products:",
      error
    );
  }
};

fetchSellerProducts();

    // ==========================================
    // CLEANUP
    // ==========================================

    return () => {
      unsubscribeSeller();
    };
  }, [id]);

  // ==========================================
  // ONLINE STATUS CHECK
  // ==========================================

  useEffect(() => {
    const checkOnlineStatus = () => {
      if (!seller?.lastSeen?.toDate) {
        setIsOnline(false);
        return;
      }

      const lastSeenTime =
        seller.lastSeen.toDate().getTime();

      const now = Date.now();

      setIsOnline(
        now - lastSeenTime < 60000
      );
    };

    // Перевіряємо одразу
    checkOnlineStatus();

    // Перевіряємо кожні 10 секунд
    const interval = setInterval(
      checkOnlineStatus,
      10000
    );

    return () => {
      clearInterval(interval);
    };
  }, [seller?.lastSeen]);

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="taker-details">
        <div className="taker-details__loading">
          <div className="taker-details__spinner" />
          <p>Loading seller profile...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // SELLER NOT FOUND
  // ==========================================

  if (!seller) {
    return (
      <div className="taker-details">
        <div className="taker-details__empty">
          <div className="taker-details__empty-icon">
            <FaUser />
          </div>

          <h2>Seller not found</h2>

          <p>
            This seller profile may no longer be available.
          </p>

          <button
            type="button"
            onClick={() => navigate("/takers")}
            className="taker-details__back-button"
          >
            <FaArrowLeft />
            Back to Takers
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // SELLER DATA
  // ==========================================

  const stats = seller.sellerStats || {};

  const completedOrders =
    Number(stats.completedOrders || 0);

  const ratingAverage =
    Number(stats.ratingAverage || 0);
    const totalListings =
      books.length +
      collections.length +
      comics.length +
      boardGames.length;

  const ratingCount =
    Number(stats.ratingCount || 0);

  const sellerName =
    seller.name ||
    seller.username ||
    "Unknown seller";

  const avatarUrl =
    seller.photoURL ||
    seller.avatarUrl ||
    null;

  const initials =
    sellerName?.charAt(0)?.toUpperCase() || "?";
    

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="taker-details">
      <div className="taker-details__container">

        {/* =====================================
            BACK
        ====================================== */}

        <button
          type="button"
          onClick={() => navigate("/takers")}
          className="taker-details__back"
        >
          <FaArrowLeft />
          <span>Back to Takers</span>
        </button>

        {/* =====================================
            HERO
        ====================================== */}

        <section className="taker-details__hero">

          <div className="taker-details__hero-glow" />

          <div className="taker-details__profile">

            {/* AVATAR */}

            <div className="taker-details__avatar-wrapper">

              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={sellerName}
                  className="taker-details__avatar"
                />
              ) : (
                <div className="taker-details__avatar taker-details__avatar--placeholder">
                  {initials}
                </div>
              )}

              {/* ONLINE */}

              {isOnline && (
                <span className="taker-details__online" />
              )}

            </div>

            {/* IDENTITY */}

            <div className="taker-details__identity">

              <div className="taker-details__eyebrow">
                <FaCheckCircle />
                Verified seller
              </div>

              <h1>{sellerName}</h1>

              <p>
                Book collector and marketplace member
              </p>

            </div>

          </div>

          {/* =====================================
              STATS
          ====================================== */}

          <div className="taker-details__stats">

            {/* COMPLETED */}

            <div className="taker-details__stat">

              <div className="taker-details__stat-icon">
                <FaCheckCircle />
              </div>

              <div>
                <strong>
                  {completedOrders}
                </strong>

                <span>
                  Completed orders
                </span>
              </div>

            </div>

            {/* RATING */}

            <div className="taker-details__stat">

              <div className="taker-details__stat-icon">
                <FaStar />
              </div>

              <div>

                <strong>
                  {ratingCount > 0
                    ? ratingAverage.toFixed(1)
                    : "0.0"}
                </strong>

                <span>
                  Rating
                  {ratingCount > 0
                    ? ` · ${ratingCount} reviews`
                    : ""}
                </span>

              </div>

            </div>

            {/* BOOKS */}

            <div className="taker-details__stat">

              <div className="taker-details__stat-icon">
                <FaBookOpen />
              </div>

              <div>

                <strong>
  {totalListings}
</strong>

<span>
  {totalListings === 1
    ? "Item"
    : "Items"}{" "}
  listed
</span>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================
            CONTENT
        ====================================== */}

        <div className="taker-details__content">

          {/* =====================================
              WISHLIST
          ====================================== */}

          {seller.wishlist && (
            <section className="taker-details__wishlist">

              <div className="taker-details__section-heading">

                <div className="taker-details__section-icon">
                  <FaHeart />
                </div>

                <div>
                  <span>
                    Looking for
                  </span>

                  <h2>
                    Wishlist
                  </h2>
                </div>

              </div>

              <div className="taker-details__wishlist-text">

                <p className="whitespace-pre-line">
                  {seller.wishlist}
                </p>

              </div>

            </section>
          )}

          {/* =====================================
              BOOKS
          ====================================== */}

          <section className="taker-details__books">

  <div className="taker-details__section-heading">

    <div className="taker-details__section-icon">
      <FaBookOpen />
    </div>

    <div>
      <span>
        Available from this seller
      </span>

   <h2>
    Available Listings
  </h2>
    </div>

    <div className="taker-details__books-count">
      {totalListings}
    </div>

  </div>

  {totalListings > 0 ? (

    <div className="taker-details__books-grid">

      {/* =========================
          BOOKS
      ========================== */}

{books.map((book, index) => (
  <div
    key={`book-${book.id}`}
    className="taker-details__book-card"
    onClick={() =>
      navigate(`/books?bookId=${book.id}`)
    }
  >
    <div className="taker-details__book-number">
      {String(index + 1).padStart(2, "0")}
    </div>

    <div className="taker-details__book-icon">
      <FaBookOpen />
    </div>

    <div className="taker-details__book-info">
      <span>
        Book
      </span>

      <h3>
        {book.name ||
          book.title ||
          "Untitled book"}
      </h3>
    </div>
  </div>
))}

      {/* =========================
          COLLECTIONS
      ========================== */}

{collections.map((bookCollection, index) => (
  <div
    key={`collection-${bookCollection.id}`}
    className="taker-details__book-card"
    onClick={() =>
      navigate(
        `/book-collections?collectionId=${bookCollection.id}`
      )
    }
  >
    <div className="taker-details__book-number">
      {String(
        books.length + index + 1
      ).padStart(2, "0")}
    </div>

    <div className="taker-details__book-icon">
      <FaBookOpen />
    </div>

    <div className="taker-details__book-info">
      <span>
        Collection ·{" "}
        {bookCollection.bookCount || 0} books
      </span>

      <h3>
        {bookCollection.collectionName ||
          "Untitled collection"}
      </h3>
    </div>
  </div>
))}
{/* =========================
    COMICS
========================= */}

{comics.map((comic, index) => (
  <div
    key={`comic-${comic.id}`}
    className="taker-details__book-card"
    onClick={() =>
      navigate(`/comics?comicId=${comic.id}`)
    }
  >
    <div className="taker-details__book-number">
      {String(
        books.length +
          collections.length +
          index +
          1
      ).padStart(2, "0")}
    </div>

    <div className="taker-details__book-icon">
      <FaBookOpen />
    </div>

    <div className="taker-details__book-info">
      <span>Comic</span>

      <h3>
        {comic.name ||
          comic.title ||
          "Untitled comic"}
      </h3>
    </div>
  </div>
))}

{/* =========================
    BOARD GAMES
========================= */}

{boardGames.map((game, index) => (
  <div
    key={`boardGame-${game.id}`}
    className="taker-details__book-card"
    onClick={() =>
      navigate(`/board-games?gameId=${game.id}`)
    }
  >
    <div className="taker-details__book-number">
      {String(
        books.length +
          collections.length +
          comics.length +
          index +
          1
      ).padStart(2, "0")}
    </div>

    <div className="taker-details__book-icon">
      <FaBookOpen />
    </div>

    <div className="taker-details__book-info">
      <span>Board Game</span>

      <h3>
        {game.name ||
          game.title ||
          "Untitled board game"}
      </h3>
    </div>
  </div>
))}

    </div>

  ) : (

    <div className="taker-details__no-books">

      <FaBookOpen />

      <h3>
        No books or collections listed yet
      </h3>

      <p>
        This seller currently has no books or collections available.
      </p>

    </div>

  )}

</section>

        </div>

      </div>
    </div>
  );
};

export default TakerDetails;