import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { useSearchParams } from "react-router-dom";

import {
  FaPlus,
  FaFilter,
  FaBookOpen,
  FaHeartCirclePlus,
  FaHeartCircleCheck,
  FaStar,
  FaPen,
  FaTrash,
  FaShare,
} from "react-icons/fa6";
import { FaSearch, FaSortAmountDown, FaTimes } from "react-icons/fa";

import { toast } from "react-toastify";

import { db } from "../../../../firebase";
import { useAuth } from "../../../../context/AuthContext";

import ProductComicModal from "../../../cart/ProductComicModal";
import CreateComicModal from "./CreateComicModal";
import EditComicModal from "./EditComicModal";

import { COMIC_GENRES } from "../../../../constants/comicMeta";
import { getBookConditionLabel } from "../../../../constants/bookMeta";

const SORT_OPTIONS = [
  {
    value: "newest",
    label: "Newest",
  },
  {
    value: "oldest",
    label: "Oldest",
  },
  {
    value: "name-asc",
    label: "Name A-Z",
  },
  {
    value: "name-desc",
    label: "Name Z-A",
  },
  {
    value: "price-low",
    label: "Price: Low to High",
  },
  {
    value: "price-high",
    label: "Price: High to Low",
  },
];

export default function Comic() {
  const { user } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();

  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");

  const [sortBy, setSortBy] = useState("newest");

  const [showFilters, setShowFilters] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [editingComic, setEditingComic] = useState(null);

  const [selectedComic, setSelectedComic] = useState(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [comicToDelete, setComicToDelete] = useState(null);

  const [deleteReason, setDeleteReason] = useState("");

  const [customReason, setCustomReason] = useState("");

  const [favoriteIds, setFavoriteIds] = useState(new Set());

  const [sellers, setSellers] = useState({});

  /*
   * ---------------------------------------------------
   * LOAD COMICS
   * ---------------------------------------------------
   */

  useEffect(() => {
    setLoading(true);

    const comicsRef = collection(db, "comics");

    const comicsQuery = query(comicsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      comicsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((comicDoc) => ({
          id: comicDoc.id,
          ...comicDoc.data(),
        }));

        setComics(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading comics:", error);

        toast.error("Failed to load comics.");

        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  /*
   * ---------------------------------------------------
   * LOAD SELLERS
   * ---------------------------------------------------
   */

  useEffect(() => {
    if (!comics.length) {
      setSellers({});
      return;
    }

    let cancelled = false;

    const loadSellers = async () => {
      try {
        const sellerIds = [
          ...new Set(comics.map((comic) => comic.sellerId).filter(Boolean)),
        ];

        const sellersData = {};

        for (const sellerId of sellerIds) {
          try {
            const sellerSnap = await getDoc(doc(db, "users", sellerId));

            if (sellerSnap.exists()) {
              const data = sellerSnap.data();

              sellersData[sellerId] = {
                id: sellerId,
                name: data.name || data.username || data.nickname || "Unknown",
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
            console.error(`Failed to load seller ${sellerId}:`, error);
          }
        }

        if (!cancelled) {
          setSellers(sellersData);
        }
      } catch (error) {
        console.error("Error loading sellers:", error);
      }
    };

    loadSellers();

    return () => {
      cancelled = true;
    };
  }, [comics]);

  /*
   * ---------------------------------------------------
   * SELLER ONLINE
   * ---------------------------------------------------
   */

  const isSellerOnline = (lastSeen) => {
    if (!lastSeen?.toDate) {
      return false;
    }

    return Date.now() - lastSeen.toDate().getTime() < 60000;
  };

  const [, setOnlineCheck] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCheck(Date.now());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  /*
   * ---------------------------------------------------
   * LOAD FAVORITES
   * ---------------------------------------------------
   */

  useEffect(() => {
    if (!user?.uid) {
      setFavoriteIds(new Set());

      return;
    }

    const favoritesQuery = query(
      collection(db, "favorites"),
      where("userId", "==", user.uid),
      where("type", "==", "comic"),
    );

    const unsubscribe = onSnapshot(
      favoritesQuery,
      (snapshot) => {
        const ids = new Set();

        snapshot.docs.forEach((favoriteDoc) => {
          const data = favoriteDoc.data();

          if (data.itemId) {
            ids.add(data.itemId);
          }

          if (data.comicId) {
            ids.add(data.comicId);
          }
        });

        setFavoriteIds(ids);
      },
      (error) => {
        console.error("Error loading comic favorites:", error);
      },
    );

    return () => unsubscribe();
  }, [user]);

  /*
   * ---------------------------------------------------
   * URL -> OPEN COMIC
   * ---------------------------------------------------
   */

  useEffect(() => {
    const comicId = searchParams.get("comicId");

    if (!comicId || !comics.length) {
      return;
    }

    const comic = comics.find((item) => item.id === comicId);

    if (comic) {
      setSelectedComic(comic);
    }
  }, [searchParams, comics]);

  /*
   * ---------------------------------------------------
   * URL -> GENRE
   * ---------------------------------------------------
   */

  useEffect(() => {
    const genre = searchParams.get("genre");

    if (genre && COMIC_GENRES.includes(genre)) {
      setSelectedGenre(genre);
    }
  }, [searchParams]);

  /*
   * ---------------------------------------------------
   * FILTER + SORT
   * ---------------------------------------------------
   */

  const filteredComics = useMemo(() => {
    let result = [...comics];

    const searchValue = search.trim().toLowerCase();

    if (searchValue) {
      result = result.filter((comic) => {
        const searchableText = [
          comic.name,
          comic.author,
          comic.artist,
          comic.publisher,
          comic.issue,
          comic.volume,
          comic.genre,
          comic.language,
          comic.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(searchValue);
      });
    }

    if (selectedGenre) {
      result = result.filter((comic) => comic.genre === selectedGenre);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest": {
          const aTime = a.createdAt?.toMillis?.() || 0;

          const bTime = b.createdAt?.toMillis?.() || 0;

          return aTime - bTime;
        }

        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");

        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");

        case "price-low":
          return Number(a.price || 0) - Number(b.price || 0);

        case "price-high":
          return Number(b.price || 0) - Number(a.price || 0);

        case "newest":
        default: {
          const aTime = a.createdAt?.toMillis?.() || 0;

          const bTime = b.createdAt?.toMillis?.() || 0;

          return bTime - aTime;
        }
      }
    });

    return result;
  }, [comics, search, selectedGenre, sortBy]);

  /*
   * ---------------------------------------------------
   * FORMAT DATE
   * ---------------------------------------------------
   */

  const formatEditedDate = (timestamp) => {
    if (!timestamp?.toDate) {
      return null;
    }

    return timestamp.toDate().toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /*
   * ---------------------------------------------------
   * CREATE
   * ---------------------------------------------------
   */

  const handleCreated = (createdComic) => {
    if (!createdComic) {
      return;
    }

    setShowCreateModal(false);
  };

  /*
   * ---------------------------------------------------
   * EDIT
   * ---------------------------------------------------
   */

  const handleEditComic = (e, comic) => {
    e.stopPropagation();

    if (!user || comic.sellerId !== user.uid) {
      toast.error("You can only edit your own comic");

      return;
    }

    setEditingComic(comic);
  };

  const handleUpdated = (updatedComic) => {
    if (!updatedComic) {
      return;
    }

    setEditingComic(null);

    setComics((prev) =>
      prev.map((item) => (item.id === updatedComic.id ? updatedComic : item)),
    );

    setSelectedComic((current) =>
      current?.id === updatedComic.id ? updatedComic : current,
    );
  };

  /*
   * ---------------------------------------------------
   * DELETE
   * ---------------------------------------------------
   */

  const handleDelete = async () => {
    if (!comicToDelete || !user) return;

    try {
      const comicRef = doc(db, "comics", comicToDelete);

      const comicSnap = await getDoc(comicRef);

      if (!comicSnap.exists()) {
        toast.error("Comic not found");
        return;
      }

      const comicData = comicSnap.data();

      await addDoc(collection(db, "deletedComicsLogs"), {
        comicId: comicToDelete,

        deletedBy: user.uid,

        deletedAt: serverTimestamp(),

        reason: deleteReason === "other" ? customReason : deleteReason,

        comicSnapshot: {
          name: comicData.name || "",

          price: comicData.price || 0,

          sellerId: comicData.sellerId || "",

          genre: comicData.genre || "",

          images: comicData.images || [],

          rating: comicData.rating || 0,

          ratingCount: comicData.ratingCount || 0,
        },
      });

      await deleteDoc(comicRef);

      setComics((prev) => prev.filter((comic) => comic.id !== comicToDelete));

      if (selectedComic?.id === comicToDelete) {
        setSelectedComic(null);
        closeComicModal();
      }

      if (editingComic?.id === comicToDelete) {
        setEditingComic(null);
      }

      toast.success("Comic deleted");

      setDeleteModalOpen(false);
      setComicToDelete(null);
      setDeleteReason("");
      setCustomReason("");
    } catch (error) {
      console.error("Error deleting comic:", error);

      toast.error("Error deleting comic");
    }
  };

  /*
   * ---------------------------------------------------
   * FAVORITE
   * ---------------------------------------------------
   */

  const handleFavorite = async (comic) => {
    if (!user?.uid) {
      toast.error("Please log in to use favorites.");

      return;
    }

    const alreadyFavorite = favoriteIds.has(comic.id);

    try {
      const favoritesRef = collection(db, "favorites");

      if (alreadyFavorite) {
const snapshot = await getDocs(
  query(
    favoritesRef,
    where("userId", "==", user.uid),
    where("type", "==", "comic"),
  ),
);

const comicFavorites =
  snapshot.docs.filter((favoriteDoc) => {
    const data = favoriteDoc.data();

    return (
      data.itemId === comic.id ||
      data.comicId === comic.id
    );
  });

await Promise.all(
  comicFavorites.map((favoriteDoc) =>
    deleteDoc(
      doc(
        db,
        "favorites",
        favoriteDoc.id,
      ),
    ),
  ),
);

        await Promise.all(
          snapshot.docs.map((favoriteDoc) =>
            deleteDoc(doc(db, "favorites", favoriteDoc.id)),
          ),
        );

        toast.success("Removed from favorites.");
      } else {
        await addDoc(favoritesRef, {
          userId: user.uid,

          itemId: comic.id,

          comicId: comic.id,

          type: "comic",

          name: comic.name || "",

          image: comic.images?.[0] || "",

          sellerId: comic.sellerId || "",

          price: Number(comic.price || 0),

          createdAt: serverTimestamp(),
        });

        toast.success("Added to favorites.");
      }
    } catch (error) {
      console.error("Error updating comic favorite:", error);

      toast.error("Failed to update favorites.");
    }
  };

  /*
   * ---------------------------------------------------
   * SHARE
   * ---------------------------------------------------
   */

  const handleShare = async (e, comic) => {
    e.stopPropagation();

    const shareUrl =
      `${window.location.origin}` + `/comics?comicId=${comic.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: comic.name || "Comic",

          text: `Check out "${comic.name}" on HobbyFlow`,

          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);

        toast.success("Comic link copied!");
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(shareUrl);

        toast.success("Comic link copied!");
      } catch {
        toast.error("Could not share the comic");
      }
    }
  };

  /*
   * ---------------------------------------------------
   * OPEN / CLOSE COMIC
   * ---------------------------------------------------
   */

  const openComicModal = (comic) => {
    setSelectedComic(comic);

    const params = new URLSearchParams(searchParams);

    params.set("comicId", comic.id);

    setSearchParams(params, {
      replace: true,
    });
  };

  const closeComicModal = () => {
    setSelectedComic(null);

    const params = new URLSearchParams(searchParams);

    params.delete("comicId");

    setSearchParams(params, {
      replace: true,
    });
  };

  /*
   * ---------------------------------------------------
   * CLEAR FILTERS
   * ---------------------------------------------------
   */

  const clearFilters = () => {
    setSearch("");
    setSelectedGenre("");

    const params = new URLSearchParams(searchParams);

    params.delete("genre");

    setSearchParams(params, {
      replace: true,
    });
  };

  return (
    <main className="py-8 dark:bg-gray-800 min-h-screen">
      <div className="container mx-auto px-4">
        {/* FILTERS */}

        <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Filter by Genre:
            </label>

            <select
              value={selectedGenre}
              onChange={(e) => {
                const value = e.target.value;

                setSelectedGenre(value);

                const params = new URLSearchParams(searchParams);

                if (value) {
                  params.set("genre", value);
                } else {
                  params.delete("genre");
                }

                setSearchParams(params, {
                  replace: true,
                });
              }}
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
              <option value="">All Genre</option>

              {COMIC_GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Sort By:
            </label>

            <div className="flex items-center gap-2">
              <FaSortAmountDown className="text-gray-400" />

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
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

          {(search || selectedGenre) && (
            <button
              type="button"
              onClick={clearFilters}
              className="
                flex
                items-center
                gap-2
                px-4
                py-2
                rounded
                bg-gray-200
                dark:bg-gray-700
                text-gray-700
                dark:text-gray-300
                hover:bg-gray-300
                dark:hover:bg-gray-600
                transition
              ">
              <FaTimes />
              Clear filters
            </button>
          )}
        </div>

        {/* RESULT COUNT */}

        {/* <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Found{" "}
          <span className="font-semibold text-gray-700 dark:text-white">
            {
              filteredComics.length
            }
          </span>{" "}
          {filteredComics.length ===
          1
            ? "comic"
            : "comics"}
        </div> */}

        {/* COMICS GRID */}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Loading comics...
            </p>
          </div>
        ) : filteredComics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredComics.map((comic) => {
              const isLendingAvailable =
                comic.isLendingAvailable ?? Number(comic.priceLending) > 0;

              const seller = sellers[comic.sellerId];

              return (
                <div
                  key={comic.id}
                  className="
                      bg-white
                      dark:bg-gray-800
                      rounded-lg
                      overflow-hidden
                      shadow-md
                      hover:shadow-lg
                      transition-all
                      duration-300
                      hover:scale-105
                      cursor-pointer
                      border
                      border-gray-200
                      dark:border-gray-700
                    "
                  onClick={() => openComicModal(comic)}>
                  {/* IMAGE */}

                  {/* IMAGE */}

                  <div className="relative h-80 overflow-hidden rounded-t-lg">
                    <img
                      src={comic.images?.[0] || ""}
                      alt={comic.name}
                      className="
      w-full
      h-full
      object-contain
    "
                    />

                    {/* COMIC BADGE */}

                    {/* <span
                      className="
                        absolute
                        top-2
                        right-2
                        z-10
                        inline-flex
                        items-center
                        gap-1.5
                        px-2
                        py-1.5
                        rounded-full
                        text-xs
                        font-bold
                        uppercase
                        tracking-wide
                        text-white
                        bg-[var(--accept-color)]
                        shadow-md
                        backdrop-blur-sm
                      ">
                      Comic
                    </span> */}
                  </div>

                  {/* CONTENT */}

                  <div className="p-4">
                    {/* TITLE */}

                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                        {comic.name}
                      </h3>
                    </div>

                    {/* AUTHOR */}

                    {comic.author && (
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                        Writer: {comic.author}
                      </p>
                    )}

                    {/* ARTIST */}

                    {comic.artist && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                        Artist: {comic.artist}
                      </p>
                    )}

                    {/* GENRE */}

                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Genre: {comic.genre}
                    </p>

                    {/* ISSUE / VOLUME */}

                    {(comic.issue || comic.volume) && (
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {comic.issue && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {comic.issue}
                          </span>
                        )}

                        {comic.issue && comic.volume && (
                          <span className="text-gray-300 dark:text-gray-600">
                            •
                          </span>
                        )}

                        {comic.volume && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {comic.volume}
                          </span>
                        )}
                      </div>
                    )}

                    {/* PAGES + LANGUAGE */}

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {comic.pages && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Number(comic.pages)} pages
                        </span>
                      )}

                      {comic.pages && comic.language && (
                        <span className="text-gray-300 dark:text-gray-600">
                          •
                        </span>
                      )}

                      {comic.language && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {comic.language}
                        </span>
                      )}

                      {comic.year && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">
                            •
                          </span>

                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {comic.year}
                          </span>
                        </>
                      )}
                    </div>

                    {/* CONDITION */}

                    {comic.condition && (
                      <div className="mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Condition:{" "}
                        </span>

                        <span
                          className="book-condition-badge"
                          data-condition={comic.condition}>
                          {getBookConditionLabel(comic.condition)}
                        </span>
                      </div>
                    )}

                    {/* PRICE */}

                    <p className="text-base font-bold text-grey-400 dark:text-white mb-1">
                      {comic.price} ₴
                    </p>
                    {comic.isCurrentlyRented === true && (
  <p className="mb-2 text-sm font-semibold text-red-600 dark:text-red-400">
    Currently rented
  </p>
)}

                    {/* EDITED */}

                    {comic.updatedAt?.toDate && (
                      <p
                        className="
                            text-xs
                            text-gray-400
                            dark:text-gray-500
                            mb-2
                          ">
                        Edited: {formatEditedDate(comic.updatedAt)}
                      </p>
                    )}

                    {/* LENDING + ACTIONS */}

                    <div className="flex justify-between items-center">
                      {isLendingAvailable && Number(comic.priceLending) > 0 && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-800 dark:text-white">
                            Lending price:
                          </span>

                          <p className="text-[var(--primary-color)] font-bold">
                            {Number(comic.priceLending).toFixed(2)} ₴
                            {comic.unit && (
                              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                                {comic.unit}
                              </span>
                            )}
                          </p>
                          <div className="comic-card__rentals
                            text-gray-400
                            dark:text-gray-500">
                            Successful rentals:{" "}
                            <span className={comic.successfulRentals > 0 ? "text-green-600 dark:text-green-500" : "text-gray-400  dark:text-gray-500"}>
                              {comic.successfulRentals || 0}
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

                              handleFavorite(comic);
                            }}
                            aria-label={
                              favoriteIds.has(comic.id)
                                ? "Remove from favorites"
                                : "Add to favorites"
                            }>
                            {favoriteIds.has(comic.id) ? (
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
                          onClick={(e) => handleShare(e, comic)}
                          className="
                              text-gray-400
                              [@media(hover:hover)]:hover:text-[var(--secondary-color)]
                              transition-colors
                            "
                          aria-label={`Share ${comic.name}`}
                          title="Share comic">
                          <FaShare className="text-2xl" />
                        </button>
                      </div>
                    </div>

                    {/* SELLER */}

                    {comic.sellerId && seller && (
                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-3">
                        <div className="relative shrink-0">
                          {seller.photoURL ? (
                            <img
                              src={seller.photoURL}
                              alt={seller.name}
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
                              {seller.name?.charAt(0)?.toUpperCase()}
                            </div>
                          )}

                          {isSellerOnline(seller.lastSeen) && (
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
                            {seller.name}
                          </p>

                          <p className="text-sm flex items-center gap-1 text-gray-700 dark:text-white">
                            Rating:{" "}
                            {seller.sellerStats?.ratingCount > 0
                              ? Number(
                                  seller.sellerStats.ratingAverage || 0,
                                ).toFixed(0)
                              : 0}{" "}
                            <FaStar className="text-[var(--accept-color)]" />
                          </p>
                        </div>
                      </div>
                    )}

                    {/* EDIT / DELETE */}

                    {user && comic.sellerId === user.uid && (
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
                          onClick={(e) => handleEditComic(e, comic)}
                          className="
                                text-gray-400
                                hover:text-blue-500
                                transition-colors
                              "
                          title="Edit comic"
                          aria-label="Edit comic">
                          <FaPen className="text-lg" />
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            setComicToDelete(comic.id);
                            setDeleteModalOpen(true);
                          }}
                          className="
    text-red-500
    hover:text-red-700
    transition-colors
  "
                          title="Delete comic"
                          aria-label="Delete comic">
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
            <FaBookOpen className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-4" />

            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No comics found for this search or genre.
            </p>

            {(search || selectedGenre) && (
              <button
                type="button"
                onClick={clearFilters}
                className="
                  mt-4
                  px-4
                  py-2
                  rounded
                  bg-gray-200
                  dark:bg-gray-700
                  text-gray-700
                  dark:text-gray-300
                  hover:bg-gray-300
                  dark:hover:bg-gray-600
                ">
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>
      {/* DELETE COMIC MODAL */}

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000]">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              Confirm Comic Deletion
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Please select the reason for deleting this comic:
            </p>

            <div className="space-y-3 mb-4">
              {/* SOLD */}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deleteComicReason"
                  value="sold"
                  checked={deleteReason === "sold"}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />

                <span className="text-gray-700 dark:text-white">Sold</span>
              </label>

              {/* NOT SOLD */}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deleteComicReason"
                  value="not_sold"
                  checked={deleteReason === "not_sold"}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />

                <span className="text-gray-700 dark:text-white">Not sold</span>
              </label>

              {/* OTHER */}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="deleteComicReason"
                  value="other"
                  checked={deleteReason === "other"}
                  onChange={(e) => setDeleteReason(e.target.value)}
                />

                <span className="text-gray-700 dark:text-white">
                  Other reason
                </span>
              </label>

              {/* CUSTOM REASON */}

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
                    dark:border-gray-600
                  "
                  placeholder="Enter your reason..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                />
              )}
            </div>

            {/* BUTTONS */}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);

                  setComicToDelete(null);

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
                type="button"
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

      {/* CREATE COMIC */}

      {showCreateModal && (
        <CreateComicModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* EDIT COMIC */}

      {editingComic && (
        <EditComicModal
          isOpen={Boolean(editingComic)}
          comic={editingComic}
          onClose={() => setEditingComic(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* COMIC PRODUCT MODAL */}

      {selectedComic && (
        <ProductComicModal
          isOpen={Boolean(selectedComic)}
          comic={selectedComic}
          seller={sellers[selectedComic.sellerId]}
          isFavorite={favoriteIds.has(selectedComic.id)}
          onFavorite={() => handleFavorite(selectedComic)}
          onShare={(e) => handleShare(e, selectedComic)}
          onClose={closeComicModal}
        />
      )}
    </main>
  );
}
