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

import { db } from "../../../../firebase";

import { useCart } from "../../../../context/CartContext";

import BoardGameModal from "../../../cart/BoardGameModal";

import EditBoardGameModal from "./EditBoardGameModal";

import {
  FaStar,
  FaPen,
  FaTrash,
  FaShare,
  FaHeartCirclePlus,
  FaHeartCircleCheck,
} from "react-icons/fa6";

import { useAuth } from "../../../../context/AuthContext";
import { useFavorites } from "../../../../context/FavoritesContext";

import { toast } from "react-toastify";

import { useLocation, useNavigate } from "react-router-dom";

import {
  BOARD_GAME_CATEGORIES,
  getBoardGameConditionLabel,
} from "../../../../constants/boardGameMeta";

import "../../../../styles/bookMetaFields.scss";

const CATEGORIES = ["All Categories", ...BOARD_GAME_CATEGORIES];

const SORT_OPTIONS = [
  { value: "default", label: "Default" },

  { value: "name-asc", label: "Name: A-Z" },

  { value: "name-desc", label: "Name: Z-A" },

  { value: "price-asc", label: "Price: Low to High" },

  { value: "price-desc", label: "Price: High to Low" },
];

const BoardGames = () => {
  const [games, setGames] = useState([]);

  const [filteredGames, setFilteredGames] = useState([]);

  const [selectedGame, setSelectedGame] = useState(null);

  const [editGame, setEditGame] = useState(null);

  const [sellers, setSellers] = useState({});

  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  const [sortOption, setSortOption] = useState("default");

  const { addToCart } = useCart();

  const { user } = useAuth();

  const { favorites, addFavorite, removeFavorite } = useFavorites();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [gameToDelete, setGameToDelete] = useState(null);

  const [deleteReason, setDeleteReason] = useState("");

  const [customReason, setCustomReason] = useState("");

  const location = useLocation();

  const navigate = useNavigate();

  const handleToggleFavorite = async (e, game) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Log in to add favorites.");
      return;
    }

    const isFavorite = favorites.some(
      (favorite) => favorite.boardGameId === game.id,
    );

    if (isFavorite) {
      await removeFavorite(game.id, "boardGame");
    } else {
      await addFavorite(game.id, "boardGame");
    }
  };

  const handleShareGame = async (e, game) => {
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/board-games?gameId=${game.id}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: game.name,

          text: `Check out "${game.name}" on GameFlow`,

          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);

        toast.success("Game link copied!");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Share error:", error);

        try {
          await navigator.clipboard.writeText(shareUrl);

          toast.success("Game link copied!");
        } catch {
          toast.error("Could not share the game");
        }
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const gameId = params.get("gameId");

    const category = params.get("category");

    if (category && CATEGORIES.includes(category)) {
      setCategoryFilter(category);
    }

    if (!gameId) {
      setSelectedGame(null);

      return;
    }

    const fetchGame = async () => {
      try {
        const gameRef = doc(db, "boardGames", gameId);

        const snap = await getDoc(gameRef);

        if (!snap.exists()) {
          toast.error("Game not found");

          navigate("/board-games", { replace: true });

          return;
        }

        setSelectedGame({
          id: snap.id,

          ...snap.data(),
        });
      } catch (error) {
        console.error("Error loading shared game:", error);

        toast.error("Could not load the game");

        navigate("/board-games", { replace: true });
      }
    };

    fetchGame();
  }, [location.search, navigate]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "boardGames"),

      (snapshot) => {
        const fetched = snapshot.docs.map((gameDoc) => ({
          id: gameDoc.id,

          ...gameDoc.data(),
        }));

        setGames(fetched);

        setFilteredGames(fetched);

        // Оновлюємо відкриту модалку, якщо товар змінився.

        setSelectedGame((current) => {
          if (!current) return null;

          return fetched.find((game) => game.id === current.id) || current;
        });

        const loadSellers = async () => {
          const sellerIds = [
            ...new Set(
              fetched

                .map((game) => game.sellerId)

                .filter(Boolean),
            ),
          ];

          const sellersData = {};

          for (const sellerId of sellerIds) {
            try {
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
            } catch (error) {
              console.error(
                `Failed to load seller ${sellerId}:`,

                error,
              );
            }
          }

          setSellers(sellersData);
        };

        loadSellers();
      },

      (error) => {
        console.error("Error loading boardGames:", error);

        toast.error("Failed to load board games.");
      },
    );

    return () => unsubscribe();
  }, []);

  const isSellerOnline = (lastSeen) => {
    if (!lastSeen?.toDate) return false;

    return Date.now() - lastSeen.toDate().getTime() < 60000;
  };

  const handleEditGame = (e, game) => {
    e.stopPropagation();

    if (!user || game.sellerId !== user.uid) {
      toast.error("You can only edit your own game");

      return;
    }

    setEditGame(game);
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
    if (!gameToDelete || !user) return;

    try {
      const gameRef = doc(db, "boardGames", gameToDelete);

      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        toast.error("Game not found");

        return;
      }

      const gameData = gameSnap.data();
      if (gameData.sellerId !== user.uid) {
        toast.error("Unauthorized");
        return;
      }
      if (gameData.isCurrentlyRented || gameData.activeRentalOrderId) {
        toast.error("Currently rented");
        return;
      }

      await addDoc(collection(db, "deletedBoardGamesLogs"), {
        gameId: gameToDelete,

        deletedBy: user.uid,

        deletedAt: serverTimestamp(),

        reason: deleteReason === "other" ? customReason : deleteReason,

        gameSnapshot: {
          name: gameData.name || "",

          price: gameData.price || 0,

          sellerId: gameData.sellerId || "",

          category: gameData.category || "",

          images: gameData.images || [],

          ratingAverage: gameData.ratingAverage || 0,

          ratingCount: gameData.ratingCount || 0,
        },
      });

      await deleteDoc(gameRef);

      setGames((prev) => prev.filter((game) => game.id !== gameToDelete));

      toast.success("Game deleted");

      setDeleteModalOpen(false);

      setGameToDelete(null);

      setDeleteReason("");

      setCustomReason("");
    } catch (error) {
      console.error(error);

      toast.error("Error deleting game");
    }
  };

  useEffect(() => {
    let filtered = [...games];

    if (categoryFilter !== "All Categories") {
      filtered = filtered.filter((game) =>
        game.category

          .toLowerCase()

          .split(",")

          .map((g) => g.trim())

          .includes(categoryFilter.toLowerCase()),
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

    setFilteredGames(filtered);
  }, [categoryFilter, sortOption, games]);

  return (
    <main className="py-8 dark:bg-gray-800">
      <div className="container mx-auto px-4">
        {/* Filters */}

        <div className="mb-6 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Filter by Category:
            </label>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full md:w-64 p-2 border rounded bg-white dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
              {CATEGORIES.map((g) => (
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

        {/* BoardGames Grid */}

        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredGames.map((game) => {
              const isLendingAvailable =
                game.isLendingAvailable ?? Number(game.priceLending) > 0;

              return (
                <div
                  key={game.id}
                  className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border border-gray-200 dark:border-gray-700"
                  onClick={() => setSelectedGame(game)}>
                  <div className="h-80 overflow-hidden rounded-t-lg">
                    <img
                      src={game.images?.[0] || ""}
                      alt={game.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                        {game.name}
                      </h3>
                    </div>
                         {game.author && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Game Designer:</span>{" "}
                          {game.author}
                        </p>
                      )}

                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      Category: {game.category}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {game.minPlayers != null && game.maxPlayers != null && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {game.minPlayers}–{game.maxPlayers} players
                        </span>
                      )}
                      {game.playTime != null && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          • {game.playTime} min
                        </span>
                      )}
                      {game.minAge != null && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          • {game.minAge}+
                        </span>
                      )}

                      {game.language && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">
                            •
                          </span>

                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {game.language}
                          </span>
                        </>
                      )}
                    </div>

                    {game.condition && (
                      <div className="mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Condition:{" "}
                        </span>

                        <span
                          className="game-condition-badge"
                          data-condition={game.condition}>
                          {getBoardGameConditionLabel(game.condition)}
                        </span>
                      </div>
                    )}

                    <p className="text-base font-bold text-grey-400 dark:text-white mb-1">
                      {game.listingType === "rental_only"
                        ? "Rental only"
                        : `${game.price} ₴`}
                    </p>

                    {game.isCurrentlyRented === true && (
                      <p className="mb-2 text-sm font-semibold text-red-600 dark:text-red-400">
                        Currently rented
                      </p>
                    )}

                    {game.updatedAt?.toDate && (
                      <p
                        className="

      text-xs

      text-gray-400

      dark:text-gray-500

      mb-2

    ">
                        Edited: {formatEditedDate(game.updatedAt)}
                      </p>
                    )}

                    <div className="flex justify-between items-center">
                      {isLendingAvailable && Number(game.priceLending) > 0 && (
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-800 dark:text-white">
                            Lending price:
                          </span>

                          {/* <p className="text-green-600 dark:text-green-500 font-bold"> */}

                          <p className="text-[var(--primary-color)] font-bold">
                            {Number(game.priceLending).toFixed(2)} ₴
                            {game.unit && (
                              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                                {game.unit}
                              </span>
                            )}
                          </p>

                          <div
                            className="game-card__rentals text-gray-400

                            dark:text-gray-500">
                            Successful rentals:{" "}
                            <span
                              className={
                                game.successfulRentals > 0
                                  ? "text-green-600 dark:text-green-500"
                                  : "text-gray-400 dark:text-gray-500"
                              }>
                              {game.successfulRentals || 0}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3 ml-auto">
                        {/* FAVORITES */}

                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(e, game)}
                          className="
    text-gray-400
    [@media(hover:hover)]:hover:text-[var(--secondary-color)]
    transition-colors
  "
                          aria-label={`Toggle favorite ${game.name}`}
                          title="Add or remove from favorites">
                          {favorites.some(
                            (favorite) => favorite.boardGameId === game.id,
                          ) ? (
                            <FaHeartCircleCheck className="text-2xl text-[var(--secondary-color)]" />
                          ) : (
                            <FaHeartCirclePlus className="text-2xl" />
                          )}
                        </button>
                        {/* SHARE */}

                        <button
                          type="button"
                          onClick={(e) => handleShareGame(e, game)}
                          className="

                          text-gray-400

                          [@media(hover:hover)]:hover:text-[var(--secondary-color)]

                          transition-colors

                        "
                          aria-label={`Share ${game.name}`}
                          title="Share game">
                          <FaShare className="text-2xl" />
                        </button>
                      </div>
                    </div>

                    {/* Seller Info */}

                    {game.sellerId && sellers[game.sellerId] && (
                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-3">
                        <div className="relative shrink-0">
                          {sellers[game.sellerId].photoURL ? (
                            <img
                              src={sellers[game.sellerId].photoURL}
                              alt={sellers[game.sellerId].name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-white">
                              {sellers[game.sellerId].name

                                ?.charAt(0)

                                ?.toUpperCase()}
                            </div>
                          )}

                          {isSellerOnline(sellers[game.sellerId].lastSeen) && (
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
                            {sellers[game.sellerId].name}
                          </p>

                          <p className="text-sm flex items-center gap-1 text-gray-700 dark:text-white">
                            Rating:{" "}
                            {sellers[game.sellerId].sellerStats?.ratingCount > 0
                              ? sellers[
                                  game.sellerId
                                ].sellerStats.ratingAverage.toFixed(0)
                              : 0}{" "}
                            <FaStar className="text-[var(--accept-color)]" />
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <div>
                        {user && game.sellerId === user.uid && (
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
                              onClick={(e) => handleEditGame(e, game)}
                              className="

          text-gray-400

          hover:text-blue-500

          transition-colors

        "
                              title="Edit game"
                              aria-label="Edit game">
                              <FaPen className="text-lg" />
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();

                                setGameToDelete(game.id);

                                setDeleteModalOpen(true);
                              }}
                              className="

          text-red-500

          hover:text-red-700

          transition-colors

        "
                              title="Delete game"
                              aria-label="Delete game">
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
              No board games found for this category.
            </p>
          </div>
        )}
      </div>

      {/* {selectedGame && (

        <BoardGameModal

          game={selectedGame}

          onClose={() => setSelectedGame(null)}

        />

      )} */}

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">
              Confirm Game Deletion
            </h2>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Please select the reason for deleting this game:
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

      {selectedGame && (
        <BoardGameModal
          game={selectedGame}
          onClose={() => {
            setSelectedGame(null);

            navigate("/board-games");
          }}
        />
      )}

      {editGame && (
        <EditBoardGameModal
          game={editGame}
          onClose={() => {
            setEditGame(null);
          }}
          onUpdated={(updatedGame) => {
            setGames((prev) =>
              prev.map((item) =>
                item.id === updatedGame.id ? updatedGame : item,
              ),
            );

            setFilteredGames((prev) =>
              prev.map((item) =>
                item.id === updatedGame.id ? updatedGame : item,
              ),
            );

            // Якщо ця книга зараз відкрита

            // у BoardGameModal — теж оновлюємо її.

            setSelectedGame((prev) =>
              prev?.id === updatedGame.id ? updatedGame : prev,
            );

            setEditGame(null);
          }}
        />
      )}
    </main>
  );
};

export default BoardGames;
