import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { useCart } from "../../../context/CartContext";
import ProductModal from "../../cart/ProductModal";
import EditBookModal from "./EditBookModal";
import {
  FaHeartCirclePlus,
  FaHeartCircleCheck,
  FaStar,
  FaPen,
  FaTrash,
  FaShare,
} from "react-icons/fa6";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import { useFavorites } from "../../../context/FavoritesContext";
import {
  getBookConditionLabel,
} from "../../../constants/bookMeta";

import "../../../styles/bookMetaFields.scss";

const GENRES = [
  "All Genre",
  "Fantasy",
  "Science Fiction",
  "Drama",
  "Romance",
  "Mystery",
  "Detective",
  "Thriller",
  "Horror",
  "Historical",
  "Adventure",
  "Dystopian",
  "Post-Apocalyptic",
  "Magical Realism",
  "Cyberpunk",
  "Biography",
  "Self-Help",
  "History",
  "Philosophy",
  "Psychology",
  "Crime Fiction",
  "Business",
  "Science & Technology",
  "Health & Fitness",
  "Travel",
  "Children’s",
  "Young Adult",
  "Educational",
  "Poetry",
  "Comics",
];

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "name-asc", label: "Name: A-Z" },
  { value: "name-desc", label: "Name: Z-A" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
];

const Books = () => {
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [editBook, setEditBook] = useState(null);
  const [sellers, setSellers] = useState({});
  const [genreFilter, setGenreFilter] = useState("All Genre");
  const [sortOption, setSortOption] = useState("default");
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { favorites, addFavorite, removeFavorite } = useFavorites();

  const handleShareBook = async (e, book) => {
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/books?bookId=${book.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: book.name,
          text: `Check out "${book.name}" on HobbyFlow`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Book link copied!");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Share error:", error);

        try {
          await navigator.clipboard.writeText(shareUrl);
          toast.success("Book link copied!");
        } catch {
          toast.error("Could not share the book");
        }
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const bookId = params.get("bookId");
    const genre = params.get("genre");

    if (genre && GENRES.includes(genre)) {
      setGenreFilter(genre);
    }

    if (!bookId) {
      setSelectedBook(null);
      return;
    }

    const fetchBook = async () => {
      try {
        const bookRef = doc(db, "books", bookId);
        const snap = await getDoc(bookRef);

        if (!snap.exists()) {
          toast.error("Book not found");
          navigate("/books", { replace: true });
          return;
        }

        setSelectedBook({
          id: snap.id,
          ...snap.data(),
        });
      } catch (error) {
        console.error("Error loading shared book:", error);
        toast.error("Could not load the book");
        navigate("/books", { replace: true });
      }
    };

    fetchBook();
  }, [location.search, navigate]);


useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "books"),
    (snapshot) => {
      const fetched = snapshot.docs.map((bookDoc) => ({
        id: bookDoc.id,
        ...bookDoc.data(),
      }));

      setBooks(fetched);
      setFilteredBooks(fetched);

      // Оновлюємо відкриту модалку, якщо товар змінився.
      setSelectedBook((current) => {
        if (!current) return null;

        return fetched.find((book) => book.id === current.id) || current;
      });

      const loadSellers = async () => {
        const sellerIds = [
          ...new Set(
            fetched
              .map((book) => book.sellerId)
              .filter(Boolean)
          ),
        ];

        const sellersData = {};

        for (const sellerId of sellerIds) {
          try {
            const sellerSnap = await getDoc(
              doc(db, "users", sellerId)
            );

            if (sellerSnap.exists()) {
              const data = sellerSnap.data();

              sellersData[sellerId] = {
                name: data.name || "Unknown",
                photoURL: data.photoURL || null,
                lastSeen: data.lastSeen || null,
                sellerStats: data.sellerStats || {
                  completedOrders: 0,
                  ratingAverage: 0,
                  ratingCount: 0,
                },
              };
            }
          } catch (error) {
            console.error(
              `Failed to load seller ${sellerId}:`,
              error
            );
          }
        }

        setSellers(sellersData);
      };

      loadSellers();
    },
    (error) => {
      console.error("Error loading books:", error);
      toast.error("Failed to load books.");
    }
  );

  return () => unsubscribe();
}, []);


  const isSellerOnline = (lastSeen) => {
    if (!lastSeen?.toDate) return false;

    return Date.now() - lastSeen.toDate().getTime() < 60000;
  };
  const handleEditBook = (e, book) => {
  e.stopPropagation();

  if (!user || book.sellerId !== user.uid) {
    toast.error("You can only edit your own book");
    return;
  }

  setEditBook(book);
};
const formatEditedDate = (timestamp) => {
  if (!timestamp?.toDate) return null;

  return timestamp.toDate().toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

  const [, setOnlineCheck] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCheck(Date.now());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleDelete = async () => {
    if (!bookToDelete || !user) return;

    try {
      const bookRef = doc(db, "books", bookToDelete);
      const bookSnap = await getDoc(bookRef);

      if (!bookSnap.exists()) {
        toast.error("Book not found");
        return;
      }

      const bookData = bookSnap.data();

      await addDoc(collection(db, "deletedBooksLogs"), {
        bookId: bookToDelete,
        deletedBy: user.uid,
        deletedAt: serverTimestamp(),

        reason: deleteReason === "other" ? customReason : deleteReason,

        bookSnapshot: {
          name: bookData.name || "",
          price: bookData.price || 0,
          sellerId: bookData.sellerId || "",
          genre: bookData.genre || "",
          images: bookData.images || [],
          ratingAverage: bookData.ratingAverage || 0,
          ratingCount: bookData.ratingCount || 0,
        },
      });

      await deleteDoc(bookRef);

      setBooks((prev) => prev.filter((book) => book.id !== bookToDelete));

      toast.success("Book deleted");

      setDeleteModalOpen(false);
      setBookToDelete(null);
      setDeleteReason("");
      setCustomReason("");
    } catch (error) {
      console.error(error);
      toast.error("Error deleting book");
    }
  };

  useEffect(() => {
    let filtered = [...books];
    if (genreFilter !== "All Genre") {
      filtered = filtered.filter((book) =>
        book.genre
          .toLowerCase()
          .split(",")
          .map((g) => g.trim())
          .includes(genreFilter.toLowerCase()),
      );
    }

    filtered.sort((a, b) => {
      switch (sortOption) {
        case "name-asc":
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
        case "name-desc":
          return b.name.toLowerCase().localeCompare(a.name.toLowerCase());
        case "price-asc":
          return Number(a.price) - Number(b.price);
        case "price-desc":
          return Number(b.price) - Number(a.price);
        default:
          return 0;
      }
    });

    setFilteredBooks(filtered);
  }, [genreFilter, sortOption, books]);

  return (
    <main className="py-8 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Filter by Genre:
            </label>
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="w-full md:w-64 p-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Sort By:
            </label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="w-full md:w-64 p-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Books Grid */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book) => {
  const isLendingAvailable =
    book.isLendingAvailable ??
    Number(book.priceLending) > 0;

  return (
    <div
      key={book.id}
                className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border border-gray-200 dark:border-gray-700"
                onClick={() => setSelectedBook(book)}>
                <div className="h-80 overflow-hidden rounded-t-lg">
                  <img
                    src={book.images?.[0] || ""}
                    alt={book.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                      {book.name}
                    </h3>
                  </div>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Genre: {book.genre}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
  {book.pages && (
    <span className="text-xs text-gray-500 dark:text-gray-400">
      {Number(book.pages)} pages
    </span>
  )}

  {book.language && (
    <>
      <span className="text-gray-300 dark:text-gray-600">
        •
      </span>

      <span className="text-xs text-gray-500 dark:text-gray-400">
        {book.language}
      </span>
    </>
  )}
</div>

{book.condition && (
  <div className="mb-2">
    <span className="text-xs text-gray-500 dark:text-gray-400">Condition: </span>
    <span
      className="book-condition-badge"
      data-condition={book.condition}
    >
      {getBookConditionLabel(book.condition)}
    </span>
  </div>
)}
                  <p className="text-base font-bold text-grey-400 dark:text-white mb-1">
                    {book.price} ₴
                  </p>
                  {book.isCurrentlyRented === true && (
  <p className="mb-2 text-sm font-semibold text-red-600 dark:text-red-400">
    Currently rented
  </p>
)}
                  {book.updatedAt?.toDate && (
  <p
    className="
      text-xs
      text-gray-400
      dark:text-gray-500
      mb-2
    "
  >
    Edited: {formatEditedDate(book.updatedAt)}
  </p>
)}

                  <div className="flex justify-between items-center">
                    {isLendingAvailable &&
  Number(book.priceLending) > 0 && (
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-800 dark:text-white">
                          Lending price:
                        </span>

                        {/* <p className="text-green-600 dark:text-green-500 font-bold"> */}
                        <p className="text-[var(--primary-color)] font-bold">
                          {Number(book.priceLending).toFixed(2)} ₴
                          {book.unit && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                              {book.unit}
                            </span>
                          )}
                        </p>
                        <div className="book-card__rentals text-gray-400
                            dark:text-gray-500">
                          Successful rentals:{" "}
                          <span className={book.successfulRentals > 0 ? "text-green-600 dark:text-green-500" : "text-gray-400 dark:text-gray-500"}>
                            {book.successfulRentals || 0}
                          </span>
                        </div>
                      </div>
                    )}
                    

                    <div className="flex items-center gap-3 ml-auto">
                      {/* FAVORITE */}
                      {user && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            const isFav = favorites.some(
                              (f) => f.bookId === book.id,
                            );

                            if (isFav) {
                              removeFavorite(book.id);
                            } else {
                              addFavorite(book.id);
                            }
                          }}
                          aria-label={
                            favorites.some((f) => f.bookId === book.id)
                              ? "Remove from favorites"
                              : "Add to favorites"
                          }>
                          {favorites.some((f) => f.bookId === book.id) ? (
                            <FaHeartCircleCheck
                              className="
                                text-3xl md:text-2xl
                                text-[var(--secondary-color)]
                              "
                            />
                          ) : (
                            <FaHeartCirclePlus
                              className="
                                text-3xl md:text-2xl
                                text-gray-400
                                [@media(hover:hover)]:hover:text-[var(--secondary-color)]
                                transition-colors
                              "
                            />
                          )}
                        </button>
                      )}

                      {/* SHARE */}
                      <button
                        type="button"
                        onClick={(e) => handleShareBook(e, book)}
                        className="
                          text-gray-400
                          [@media(hover:hover)]:hover:text-[var(--secondary-color)]
                          transition-colors
                        "
                        aria-label={`Share ${book.name}`}
                        title="Share book">
                        <FaShare className="text-2xl" />
                      </button>
                    </div>
                  </div>

                  {/* Seller Info */}
                  {book.sellerId && sellers[book.sellerId] && (
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-3">
                      <div className="relative shrink-0">
                        {sellers[book.sellerId].photoURL ? (
                          <img
                            src={sellers[book.sellerId].photoURL}
                            alt={sellers[book.sellerId].name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-white">
                            {sellers[book.sellerId].name
                              ?.charAt(0)
                              ?.toUpperCase()}
                          </div>
                        )}

                        {isSellerOnline(sellers[book.sellerId].lastSeen) && (
                          <span
                            className="
            absolute
            bottom-0
            right-0
            w-2.5
            h-2.5
            rounded-full
            bg-green-500
            border-2
            border-white
            dark:border-gray-800
          "
                          />
                        )}
                      </div>

                      <div>
                        <p className="text-base font-semibold text-gray-800 dark:text-white">
                          {sellers[book.sellerId].name}
                        </p>

                        <p className="text-sm flex items-center gap-1 text-gray-700 dark:text-white">
                          Rating:{" "}
                          {sellers[book.sellerId].sellerStats?.ratingCount > 0
                            ? sellers[
                                book.sellerId
                              ].sellerStats.ratingAverage.toFixed(0)
                            : 0}{" "}
                          <FaStar className="text-[var(--accept-color)]" />
                        </p>
                      </div>
                    </div>
                  )}
                  <div>
                    <div>
  {user && book.sellerId === user.uid && (
    <div
      className="
        flex
        items-center
        justify-center
        gap-4
        pt-4
      "
    >
      {/* EDIT */}

      <button
        type="button"
        onClick={(e) =>
          handleEditBook(e, book)
        }
        className="
          text-gray-400
          hover:text-blue-500
          transition-colors
        "
        title="Edit book"
        aria-label="Edit book"
      >
        <FaPen className="text-lg" />
      </button>

      {/* DELETE */}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();

          setBookToDelete(book.id);
          setDeleteModalOpen(true);
        }}
        className="
          text-red-500
          hover:text-red-700
          transition-colors
        "
        title="Delete book"
        aria-label="Delete book"
      >
        <FaTrash className="text-lg" />
      </button>
    </div>
  )}
</div>
                  </div>
                </div>
              </div>
              );
})}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No books found for this genre.
            </p>
          </div>
        )}
      </div>

      {/* {selectedBook && (
        <ProductModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
        />
      )} */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              Confirm Book Deletion
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Please select the reason for deleting this book:
            </p>

            <div className="space-y-3 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deleteReason"
                  value="sold"
                  checked={deleteReason === "sold"}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />
                <span className="text-gray-700 dark:text-white">Sold</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deleteReason"
                  value="not_sold"
                  checked={deleteReason === "not_sold"}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />
                <span className="text-gray-700 dark:text-white">Not sold</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deleteReason"
                  value="other"
                  checked={deleteReason === "other"}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />
                <span className="text-gray-700 dark:text-white">
                  Other reason
                </span>
              </label>

              {deleteReason === "other" && (
                <textarea
                  className="w-full mt-2 p-2 border rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Enter your reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteReason("");
                  setCustomReason("");
                }}
                className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white">
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={
                  !deleteReason ||
                  (deleteReason === "other" && !customReason.trim())
                }
                className={`px-4 py-2 rounded text-white ${
                  !deleteReason ||
                  (deleteReason === "other" && !customReason.trim())
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedBook && (
        <ProductModal
          book={selectedBook}
          onClose={() => {
            setSelectedBook(null);
            navigate("/books");
          }}
        />
      )}
      {editBook && (
  <EditBookModal
    book={editBook}
    onClose={() => {
      setEditBook(null);
    }}
    onUpdated={(updatedBook) => {
      setBooks((prev) =>
        prev.map((item) =>
          item.id === updatedBook.id
            ? updatedBook
            : item,
        ),
      );

      setFilteredBooks((prev) =>
        prev.map((item) =>
          item.id === updatedBook.id
            ? updatedBook
            : item,
        ),
      );

      // Якщо ця книга зараз відкрита
      // у ProductModal — теж оновлюємо її.
      setSelectedBook((prev) =>
        prev?.id === updatedBook.id
          ? updatedBook
          : prev,
      );

      setEditBook(null);
    }}
  />
)}
    </main>
  );
};

export default Books;
