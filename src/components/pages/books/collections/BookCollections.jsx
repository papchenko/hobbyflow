import { useEffect, useState } from "react";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../../../firebase";

import ProductCollectionModal from "../../../cart/ProductCollectionModal";
import EditBookCollectionModal from "./EditBookCollectionModal";

import {
  FaTrash,
  FaShare,
  FaBook,
  FaStar,
  FaPen,
  FaHeartCirclePlus,
  FaHeartCircleCheck,
} from "react-icons/fa6";

import { useAuth } from "../../../../context/AuthContext";
import { useFavorites } from "../../../../context/FavoritesContext";
import { toast } from "react-toastify";

import { useLocation, useNavigate } from "react-router-dom";

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
  { value: "books-desc", label: "Most Books" },
  { value: "books-asc", label: "Fewest Books" },
];

const BookCollections = () => {
  const [collections, setCollections] = useState([]);
  const [filteredCollections, setFilteredCollections] = useState([]);

  const [sellers, setSellers] = useState({});

  const [selectedCollection, setSelectedCollection] = useState(null);
  const [editCollection, setEditCollection] = useState(null);

  const [genreFilter, setGenreFilter] = useState("All Genre");

  const [sortOption, setSortOption] = useState("default");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [collectionToDelete, setCollectionToDelete] = useState(null);

  const [deleteReason, setDeleteReason] = useState("");

  const [customReason, setCustomReason] = useState("");

  const { user } = useAuth();

  const { favorites, addFavorite, removeFavorite } = useFavorites();

  const location = useLocation();
  const navigate = useNavigate();

  /* --------------------------------
     SHARE
  -------------------------------- */

  const handleShareCollection = async (e, bookCollection) => {
    e.stopPropagation();

    const shareUrl =
      `${window.location.origin}` +
      `/book-collections?collectionId=${bookCollection.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: bookCollection.collectionName || "Book Collection",

          text: `Check out "${
            bookCollection.collectionName || "Book Collection"
          }" on HobbyFlow`,

          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);

        toast.success("Collection link copied!");
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      console.error("Share collection error:", error);

      try {
        await navigator.clipboard.writeText(shareUrl);

        toast.success("Collection link copied!");
      } catch {
        toast.error("Could not share the collection");
      }
    }
  };

  /* --------------------------------
     FAVORITE COLLECTION
  -------------------------------- */

  const handleToggleFavorite = (e, bookCollection) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Login first");
      return;
    }

    /*
      ВАЖЛИВО:

      Для колекції передаємо:
      id + "collection"

      Твій FavoritesContext має створити
      favorite приблизно такого типу:

      {
        userId: user.uid,
        collectionId: bookCollection.id,
        type: "collection"
      }
    */

    const isFavorite = favorites.some(
      (favorite) =>
        favorite.collectionId === bookCollection.id ||
        (favorite.type === "collection" &&
          favorite.collectionId === bookCollection.id),
    );

    if (isFavorite) {
      removeFavorite(bookCollection.id, "collection");
    } else {
      addFavorite(bookCollection.id, "collection");
    }
  };

  /* --------------------------------
     OPEN SHARED COLLECTION
  -------------------------------- */

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const collectionId = params.get("collectionId");

    const genre = params.get("genre");

    if (genre && GENRES.includes(genre)) {
      setGenreFilter(genre);
    }

    if (!collectionId) {
      setSelectedCollection(null);
      return;
    }

    const fetchCollection = async () => {
      try {
        const collectionRef = doc(db, "bookCollections", collectionId);

        const snap = await getDoc(collectionRef);

        if (!snap.exists()) {
          toast.error("Collection not found");

          navigate("/book-collections", { replace: true });

          return;
        }

        setSelectedCollection({
          id: snap.id,
          ...snap.data(),
        });
      } catch (error) {
        console.error("Error loading collection:", error);

        toast.error("Could not load the collection");

        navigate("/book-collections", { replace: true });
      }
    };

    fetchCollection();
  }, [location.search, navigate]);

  /* --------------------------------
     LOAD COLLECTIONS
  -------------------------------- */

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const snap = await getDocs(collection(db, "bookCollections"));

        const fetched = snap.docs.map((collectionDoc) => ({
          id: collectionDoc.id,
          ...collectionDoc.data(),
        }));

        setCollections(fetched);
        setFilteredCollections(fetched);

        const sellerIds = [
          ...new Set(fetched.map((item) => item.sellerId).filter(Boolean)),
        ];

        const sellersData = {};

        for (const sellerId of sellerIds) {
          const sellerSnap = await getDoc(doc(db, "users", sellerId));

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
        }

        setSellers(sellersData);
      } catch (error) {
        console.error("Error loading collections:", error);

        toast.error("Could not load collections");
      }
    };

    fetchCollections();
  }, []);

  const isSellerOnline = (lastSeen) => {
    if (!lastSeen?.toDate) return false;

    return Date.now() - lastSeen.toDate().getTime() < 60000;
  };

  const [, setOnlineCheck] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCheck(Date.now());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleEditCollection = (e, item) => {
    e.stopPropagation();

    if (!user || item.sellerId !== user.uid) {
      toast.error("You can only edit your own collection");
      return;
    }

    setEditCollection(item);
  };

  /* --------------------------------
     DELETE
  -------------------------------- */

  const handleDelete = async () => {
    if (!collectionToDelete || !user) {
      return;
    }

    try {
      const collectionRef = doc(db, "bookCollections", collectionToDelete);

      const collectionSnap = await getDoc(collectionRef);

      if (!collectionSnap.exists()) {
        toast.error("Collection not found");

        return;
      }

      const data = collectionSnap.data();

      await addDoc(collection(db, "deletedBookCollectionsLogs"), {
        collectionId: collectionToDelete,

        deletedBy: user.uid,

        deletedAt: serverTimestamp(),

        reason: deleteReason === "other" ? customReason : deleteReason,

        collectionSnapshot: {
          collectionName: data.collectionName || "",

          price: data.price || 0,

          sellerId: data.sellerId || "",

          genre: data.genre || "",

          completeness: data.completeness || "",

          completenessLabel: data.completenessLabel || "",

          bookCount: data.bookCount || 0,

          books: data.books || [],
        },
      });

      await deleteDoc(collectionRef);

      setCollections((prev) =>
        prev.filter((item) => item.id !== collectionToDelete),
      );

      toast.success("Collection deleted");

      setDeleteModalOpen(false);
      setCollectionToDelete(null);
      setDeleteReason("");
      setCustomReason("");
    } catch (error) {
      console.error("Collection deletion error:", error);

      toast.error("Error deleting collection");
    }
  };

  /* --------------------------------
     FILTER / SORT
  -------------------------------- */

  useEffect(() => {
    let filtered = [...collections];

    if (genreFilter !== "All Genre") {
      filtered = filtered.filter((item) =>
        String(item.genre || "")
          .toLowerCase()
          .split(",")
          .map((g) => g.trim())
          .includes(genreFilter.toLowerCase()),
      );
    }

    filtered.sort((a, b) => {
      switch (sortOption) {
        case "name-asc":
          return (
            a.collectionName
              ?.toLowerCase()
              .localeCompare(b.collectionName?.toLowerCase()) || 0
          );

        case "name-desc":
          return (
            b.collectionName
              ?.toLowerCase()
              .localeCompare(a.collectionName?.toLowerCase()) || 0
          );

        case "price-asc":
          return Number(a.price) - Number(b.price);

        case "price-desc":
          return Number(b.price) - Number(a.price);

        case "books-desc":
          return Number(b.bookCount) - Number(a.bookCount);

        case "books-asc":
          return Number(a.bookCount) - Number(b.bookCount);

        default:
          return 0;
      }
    });

    setFilteredCollections(filtered);
  }, [genreFilter, sortOption, collections]);

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

  return (
    <main className="py-8 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        {/* FILTERS */}

        <div
          className="
          mb-6
          flex
          flex-col
          md:flex-row
          md:items-center
          md:space-x-4
          space-y-4
          md:space-y-0
        ">
          <div>
            <label
              className="
              block
              text-gray-700
              dark:text-gray-300
              mb-2
            ">
              Filter by Genre:
            </label>

            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="
                w-full
                md:w-64
                p-2
                border
                rounded
                bg-white
                dark:bg-gray-700
                dark:text-gray-300
                border-gray-300
                dark:border-gray-600
              ">
              {GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="
              block
              text-gray-700
              dark:text-gray-300
              mb-2
            ">
              Sort By:
            </label>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="
                w-full
                md:w-64
                p-2
                border
                rounded
                bg-white
                dark:bg-gray-700
                dark:text-gray-300
                border-gray-300
                dark:border-gray-600
              ">
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* GRID */}

        {filteredCollections.length > 0 ? (
          <div
            className="
            grid
            grid-cols-1
            sm:grid-cols-2
            md:grid-cols-3
            lg:grid-cols-4
            gap-6
          ">
            {filteredCollections.map((item) => {
              const isFavorite = favorites.some(
                (favorite) =>
                  favorite.collectionId === item.id ||
                  (favorite.type === "collection" &&
                    favorite.collectionId === item.id),
              );

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCollection(item)}
                  className="
                      bg-white
                      dark:bg-gray-800
                      rounded-xl
                      overflow-hidden
                      transition-all
                      duration-300
                      hover:scale-[1.02]
                      cursor-pointer
                      border
                      border-gray-200
                      dark:border-gray-700
                    ">
                  {/* BOOK COVERS */}

                  <div
                    className="
                      relative
                      h-64
                      p-3
                      overflow-hidden
                    ">
                      
                    <div
                      className="
                        h-full
                        flex
                        items-center
                        justify-center
                      ">
                      {item.books?.slice(0, 5).map((book, index) => (
                        <div
                          key={index}
                          className="
                                  relative
                                  h-52
                                  w-24
                                  flex-shrink-0
                                  transition-transform
                                  duration-300
                                "
                          style={{
                            zIndex: 10 - index,

                            marginLeft: index === 0 ? 0 : "-18px",

                            transform: `rotate(${
                              index === 0
                                ? -4
                                : index ===
                                    Math.min(4, (item.books || []).length - 1)
                                  ? 4
                                  : 0
                            }deg)`,
                          }}>
                          <img
                            src={book.image || book.images?.[0] || ""}
                            alt={book.title || book.name || ""}
                            className="
                                    w-full
                                    h-full
                                    object-cover
                                    rounded-md
                                    p-3.5
                                  "
                          />
                        </div>
                      ))}

                      {item.bookCount > 5 && (
                        <div
                          className="
                            absolute
                            right-3
                            bottom-2
                            bg-black/70
                            text-white
                            text-xs
                            font-semibold
                            px-3
                            py-1.5
                            rounded-full
                          ">
                          + {item.bookCount - 5} more
                        </div>
                      )}
                    </div>

                    {/* COMPLETENESS */}

                    <div
                      className="
                        absolute
                        left-3
                        top-3
                        bg-[var(--primary-color)]
                        text-white
                        text-xs
                        font-semibold
                        px-3
                        py-1.5
                        rounded-full
                        shadow
                      ">
                      {item.completenessLabel}
                    </div>
                  </div>

                  {/* CONTENT */}

                  <div className="p-4">
                    <div
                      className="
                        flex
                        justify-between
                        items-start
                        gap-3
                      ">
                      <div className="min-w-0">
                        <h3
                          className="
                            text-lg
                            font-bold
                            text-gray-800
                            dark:text-white
                            line-clamp-2
                          ">
                          {item.collectionName}
                        </h3>

                        {item.seriesName && (
                          <p
                            className="
                              text-sm
                              text-gray-500
                              dark:text-gray-400
                              mt-1
                            ">
                            {item.seriesName}
                          </p>
                        )}
                      </div>

                      {/* ACTIONS */}

                      <div
                        className="
                          flex
                          items-center
                          gap-3
                          flex-shrink-0
                        ">
                        {/* FAVORITE */}

                        {user && (
                          <button
                            type="button"
                            onClick={(e) => handleToggleFavorite(e, item)}
                            aria-label={
                              isFavorite
                                ? "Remove collection from favorites"
                                : "Add collection to favorites"
                            }
                            title={
                              isFavorite
                                ? "Remove from favorites"
                                : "Add to favorites"
                            }>
                            {isFavorite ? (
                              <FaHeartCircleCheck
                                className="
                                    text-3xl
                                    md:text-2xl
                                    text-[var(--secondary-color)]
                                  "
                              />
                            ) : (
                              <FaHeartCirclePlus
                                className="
                                    text-3xl
                                    md:text-2xl
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
                          onClick={(e) => handleShareCollection(e, item)}
                          className="
                              text-gray-400
                              [@media(hover:hover)]:hover:text-[var(--secondary-color)]
                              transition-colors
                            "
                          aria-label={`Share ${item.collectionName}`}
                          title="Share collection">
                          <FaShare className="text-2xl" />
                        </button>
                      </div>
                    </div>

                    {/* INFO */}

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        mt-2
                        text-sm
                        text-gray-500
                        dark:text-gray-400
                      ">
                      <FaBook />

                      <span>{item.bookCount} books</span>

                      {item.genre && (
                        <>
                          <span>•</span>

                          <span>{item.genre}</span>
                        </>
                      )}
                    </div>

                    {/* edit data */}
                    {item.updatedAt?.toDate && (
                      <div
                        className="
      mt-2
      text-xs
      text-gray-400
      dark:text-gray-500
    ">
                        Edited: {formatEditedDate(item.updatedAt)}
                      </div>
                    )}

                    {/* PRICE */}

                    <div className="mt-3">
                      <span
                        className="
                          text-xs
                          text-gray-500
                          dark:text-gray-400
                        ">
                        Entire collection
                      </span>

                      <p
                        className="
                          text-xl
                          font-bold
                          text-gray-800
                          dark:text-white
                        ">
                        {Number(item.price || 0).toFixed(2)} ₴
                      </p>
                    </div>

                    {/* SELLER */}

                    {/* SELLER */}

                    {item.sellerId && sellers[item.sellerId] && (
                      <div
                        className="
      mt-4
      pt-3
      border-t
      border-gray-200
      dark:border-gray-700
      flex
      items-center
      space-x-3
    ">
                        {/* AVATAR */}

                        <div
                          className="
        relative
        shrink-0
      ">
                          {sellers[item.sellerId].photoURL ? (
                            <img
                              src={sellers[item.sellerId].photoURL}
                              alt={sellers[item.sellerId].name}
                              className="
              w-8
              h-8
              rounded-full
              object-cover
            "
                            />
                          ) : (
                            <div
                              className="
            w-8
            h-8
            rounded-full
            bg-gray-300
            dark:bg-gray-600
            flex
            items-center
            justify-center
            text-sm
            font-bold
            text-white
          ">
                              {sellers[item.sellerId].name
                                ?.charAt(0)
                                ?.toUpperCase()}
                            </div>
                          )}

                          {/* ONLINE DOT */}

                          {isSellerOnline(sellers[item.sellerId].lastSeen) && (
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

                        {/* SELLER INFO */}

                        <div>
                          <p
                            className="
          text-sm
          font-semibold
          text-gray-800
          dark:text-white
        ">
                            {sellers[item.sellerId].name}
                          </p>

                          <p
                            className="
          text-xs
          flex
          items-center
          gap-1
          text-gray-600
          dark:text-gray-300
        ">
                            Rating:{" "}
                            {sellers[item.sellerId].sellerStats?.ratingCount > 0
                              ? sellers[
                                  item.sellerId
                                ].sellerStats.ratingAverage.toFixed(0)
                              : 0}
                            <FaStar className="text-[var(--accept-color)]" />
                          </p>
                        </div>
                      </div>
                    )}

                    {/* DELETE */}

                    {user && item.sellerId === user.uid && (
                      <div
                        className="
      flex
      items-center
      justify-center
      gap-4
      pt-4
    ">
                        {/* EDIT */}

                        <button
                          type="button"
                          onClick={(e) => handleEditCollection(e, item)}
                          className="
        text-gray-400
        hover:text-blue-500
        transition-colors
      "
                          title="Edit collection"
                          aria-label="Edit collection">
                          <FaPen className="text-lg" />
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            setCollectionToDelete(item.id);

                            setDeleteModalOpen(true);
                          }}
                          className="
        text-red-500
        hover:text-red-700
        transition-colors
      "
                          title="Delete collection"
                          aria-label="Delete collection">
                          <FaTrash className="text-lg" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p
              className="
              text-gray-500
              dark:text-gray-400
              text-lg
            ">
              No book collections found.
            </p>
          </div>
        )}
      </div>

      {/* COLLECTION MODAL */}

      {selectedCollection && (
        <ProductCollectionModal
          collection={selectedCollection}
          onClose={() => {
            setSelectedCollection(null);

            navigate("/book-collections");
          }}
        />
      )}
      {editCollection && (
        <EditBookCollectionModal
          collection={editCollection}
          onClose={() => {
            setEditCollection(null);
          }}
          onUpdated={(updatedCollection) => {
            setCollections((prev) =>
              prev.map((item) =>
                item.id === updatedCollection.id ? updatedCollection : item,
              ),
            );

            setFilteredCollections((prev) =>
              prev.map((item) =>
                item.id === updatedCollection.id ? updatedCollection : item,
              ),
            );

            // Якщо ця колекція зараз відкрита
            // у ProductCollectionModal —
            // теж оновлюємо її.
            setSelectedCollection((prev) =>
              prev?.id === updatedCollection.id ? updatedCollection : prev,
            );

            setEditCollection(null);
          }}
        />
      )}

      {/* DELETE MODAL */}

      {deleteModalOpen && (
        <div
          className="
          fixed
          inset-0
          bg-black/60
          flex
          items-center
          justify-center
          z-50
        ">
          <div
            className="
            bg-white
            dark:bg-gray-800
            rounded-xl
            p-6
            w-full
            max-w-md
          ">
            <h2
              className="
              text-xl
              font-bold
              mb-4
              text-gray-800
              dark:text-white
            ">
              Confirm Collection Deletion
            </h2>

            <p
              className="
              text-sm
              text-gray-500
              dark:text-gray-400
              mb-4
            ">
              Please select the reason for deleting this collection:
            </p>

            <div
              className="
              space-y-3
              mb-4
            ">
              <label
                className="
                flex
                items-center
                gap-2
                cursor-pointer
              ">
                <input
                  type="radio"
                  name="collectionDeleteReason"
                  value="sold"
                  checked={deleteReason === "sold"}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />

                <span
                  className="
                  text-gray-700
                  dark:text-white
                ">
                  Sold
                </span>
              </label>

              <label
                className="
                flex
                items-center
                gap-2
                cursor-pointer
              ">
                <input
                  type="radio"
                  name="collectionDeleteReason"
                  value="not_sold"
                  checked={deleteReason === "not_sold"}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />

                <span
                  className="
                  text-gray-700
                  dark:text-white
                ">
                  Not sold
                </span>
              </label>

              <label
                className="
                flex
                items-center
                gap-2
                cursor-pointer
              ">
                <input
                  type="radio"
                  name="collectionDeleteReason"
                  value="other"
                  checked={deleteReason === "other"}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />

                <span
                  className="
                  text-gray-700
                  dark:text-white
                ">
                  Other reason
                </span>
              </label>

              {deleteReason === "other" && (
                <textarea
                  className="
                    w-full
                    mt-2
                    p-2
                    border
                    rounded
                    dark:bg-gray-700
                    dark:text-white
                  "
                  placeholder="Enter your reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
              )}
            </div>

            <div
              className="
              flex
              justify-end
              gap-3
            ">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);

                  setDeleteReason("");

                  setCustomReason("");
                }}
                className="
                  px-4
                  py-2
                  rounded
                  bg-gray-300
                  dark:bg-gray-600
                  text-gray-800
                  dark:text-white
                ">
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={
                  !deleteReason ||
                  (deleteReason === "other" && !customReason.trim())
                }
                className={`
                  px-4
                  py-2
                  rounded
                  text-white
                  ${
                    !deleteReason ||
                    (deleteReason === "other" && !customReason.trim())
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }
                `}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default BookCollections;
