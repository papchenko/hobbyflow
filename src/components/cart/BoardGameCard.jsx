
import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { FaStar } from "react-icons/fa6";
import { FaUsers, FaClock, FaChild, FaLanguage } from "react-icons/fa";

import {
  getBoardGameConditionLabel,
  getBoardGameListingType,
} from "../../constants/boardGameMeta";
import ImageLightbox from "../ui/ImageLightbox";

import "../../styles/bookMetaFields.scss";

const BoardGameCard = ({ game, onClick }) => {
  const [seller, setSeller] = useState(null);
  const [liveGame, setLiveGame] = useState(null);

  useEffect(() => {
    if (!game?.id) return;

    const gameRef = doc(db, "boardGames", game.id);

    const unsubscribe = onSnapshot(
      gameRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setLiveGame({
            id: snapshot.id,
            ...snapshot.data(),
          });
        } else {
          setLiveGame(null);
        }
      },
      (error) => {
        console.error("Error listening to board game:", error);
      }
    );

    return () => unsubscribe();
  }, [game?.id]);

  const currentGame =
    liveGame?.id === game?.id ? liveGame : game;

  useEffect(() => {
    if (!currentGame?.sellerId) {
      setSeller(null);
      return;
    }

    let active = true;

    const fetchSeller = async () => {
      try {
        const sellerSnap = await getDoc(
          doc(db, "users", currentGame.sellerId)
        );

        if (!active) return;

        if (sellerSnap.exists()) {
          const data = sellerSnap.data();

          setSeller({
            name: data.name || "Unknown",
            photoURL: data.photoURL || null,
            sellerStats: data.sellerStats || {
              completedOrders: 0,
              ratingAverage: 0,
              ratingCount: 0,
            },
          });
        } else {
          setSeller(null);
        }
      } catch (error) {
        console.error("Error loading seller:", error);
      }
    };

    fetchSeller();

    return () => {
      active = false;
    };
  }, [currentGame?.sellerId]);

  const listingType = getBoardGameListingType(currentGame);

  const isRentalOnly = listingType === "rental_only";
  const isLendingAvailable = listingType !== "sale";

  const isCurrentlyRented =
    currentGame?.isCurrentlyRented === true ||
    Boolean(currentGame?.activeRentalOrderId);

  return (
    <div
      className="w-full h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border border-gray-200 dark:border-gray-700"
      onClick={onClick}
    >
      <div className="h-80 overflow-hidden rounded-t-lg relative">
        <img
          src={currentGame?.images?.[0] || ""}
          alt={currentGame?.name || "Board game"}
          className="w-full h-full object-contain"
          loading="lazy"
        />

        <div
          className="
            absolute top-3 left-3 flex items-center gap-1.5
            px-2.5 py-1 rounded-full
            bg-[var(--secondary-color)]
            text-white text-xs font-bold shadow-md
          "
        >
          BOARD GAMES
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
          {currentGame?.name}
        </h3>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
          Category: {currentGame?.category || "Other"}
        </p>
        {/* {currentGame?.author && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Game Designer:</span>{" "}
            {currentGame.author}
          </p>
        )} */}

        <div className="flex flex-wrap items-center gap-2 mb-2">
          {currentGame?.minPlayers != null &&
            currentGame?.maxPlayers != null && (
              <span className="flex gap-1 items-center text-xs text-gray-500 dark:text-gray-400">
                <FaUsers />
                {currentGame.minPlayers}–{currentGame.maxPlayers} players
              </span>
            )}

          {currentGame?.playTime != null && (
            <span className="flex gap-1 items-center text-xs text-gray-500 dark:text-gray-400">
              <FaClock />
              {currentGame.playTime} min
            </span>
          )}

          {currentGame?.minAge != null && (
            <span className="flex gap-1 items-center text-xs text-gray-500 dark:text-gray-400">
              <FaChild />
              {currentGame.minAge}+
            </span>
          )}

          {currentGame?.language && (
            <span className="flex gap-1 items-center text-xs text-gray-500 dark:text-gray-400">
              <FaLanguage />
              {currentGame.language}
            </span>
          )}
        </div>

        {currentGame?.condition && (
          <div className="mb-2">
            <span
              className="book-condition-badge"
              data-condition={currentGame.condition}
            >
              {getBoardGameConditionLabel(currentGame.condition)}
            </span>
          </div>
        )}

        {!isRentalOnly && (
          <p className="text-base font-bold text-gray-800 dark:text-white mb-1">
            {Number(currentGame?.price || 0).toFixed(2)} ₴
          </p>
        )}

        {isCurrentlyRented && (
          <p className="mb-2 text-sm font-semibold text-red-600 dark:text-red-400">
            Currently rented
          </p>
        )}

        {isLendingAvailable &&
          Number(currentGame?.priceLending) > 0 && (
            <>
              <span className="text-xs text-gray-800 dark:text-white">
                {isRentalOnly ? "Rental price:" : "Lending price:"}
              </span>

              <p className="text-green-600 dark:text-green-500 font-bold pb-2">
                {Number(currentGame.priceLending).toFixed(2)} ₴

                {currentGame.unit && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                    {currentGame.unit}
                  </span>
                )}
              </p>

              <div className="book-card__rentals text-gray-400 dark:text-gray-500">
                Successful rentals:{" "}
                <span
                  className={
                    Number(currentGame.successfulRentals) > 0
                      ? "text-green-600 dark:text-green-500"
                      : "text-gray-400 dark:text-gray-500"
                  }
                >
                  {currentGame.successfulRentals || 0}
                </span>
              </div>
            </>
          )}

        {seller && (
          <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-3">
            {seller.photoURL ? (
              <img
                src={seller.photoURL}
                alt={seller.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-bold text-white">
                {seller.name?.charAt(0)?.toUpperCase()}
              </div>
            )}

            <div>
              <p className="text-base font-semibold text-gray-800 dark:text-white">
                {seller.name}
              </p>

              <p className="text-sm flex items-center gap-1 text-gray-700 dark:text-white">
                Rating:{" "}
                {seller.sellerStats?.ratingCount > 0
                  ? Number(
                      seller.sellerStats.ratingAverage || 0
                    ).toFixed(0)
                  : 0}{" "}
                <FaStar className="text-[var(--accept-color)]" />
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardGameCard;
