import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import {
  FaHeart,
  FaRegHeart,
  FaShareAlt,
  FaEdit,
  FaTrash,
  FaUser,
  FaStar,
  FaLanguage,
  FaFileAlt,
  FaCalendarAlt,
  FaPaintBrush,
} from "react-icons/fa";
import { FaMasksTheater } from "react-icons/fa6";

import { getBookConditionLabel } from "../../constants/bookMeta";

import "../../styles/bookMetaFields.scss";

const ProductComicCard = ({
  comic,
  seller,
  user,
  isFavorite = false,
  onFavorite,
  onShare,
  onClick,
  onEdit,
  onDelete,
}) => {
  const [liveComic, setLiveComic] = useState(null);

useEffect(() => {
  if (!comic?.id) return;

  const unsubscribe = onSnapshot(
    doc(db, "comics", comic.id),
    (snapshot) => {
      if (snapshot.exists()) {
        setLiveComic({
          id: snapshot.id,
          ...snapshot.data(),
        });
      } else {
        setLiveComic(null);
      }
    },
    (error) => {
      console.error("Error listening to comic:", error);
    }
  );

  return () => unsubscribe();
}, [comic?.id]);

if (!comic) return null;

const currentComic =
  liveComic?.id === comic.id
    ? liveComic
    : comic;
  if (!comic) return null;

  const image = comic.images?.[0] || comic.image || "/placeholder-book.jpg";

  const isOwner = Boolean(user?.uid) && comic.sellerId === user.uid;

  const sellerName =
    seller?.name ||
    seller?.username ||
    seller?.nickname ||
    comic.sellerName ||
    "Unknown";

  const sellerPhoto =
    seller?.photoURL || seller?.avatar || comic.sellerPhoto || "";

  const sellerStats = seller?.sellerStats || {};

  const rating = Number(
    sellerStats?.ratingAverage ?? seller?.rating ?? comic.rating ?? 0,
  );

  const ratingCount = Number(
    sellerStats?.ratingCount ?? seller?.ratingCount ?? comic.ratingCount ?? 0,
  );

const listingType =
  currentComic.listingType ??
  (
    (
      currentComic.isLendingAvailable ??
      (Number(currentComic.priceLending) > 0)
    )
      ? "sale_and_rental"
      : "sale"
  );

const isRentalOnly = listingType === "rental_only";

const isLendingAvailable = listingType !== "sale";

const isCurrentlyRented =
  currentComic.isCurrentlyRented === true;

const price = Number(currentComic.price || 0);

const lendingPrice = Number(currentComic.priceLending || 0);

  return (
    <div
      className="
        w-full
        h-full
        flex
        flex-col
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
      onClick={() => onClick?.(comic)}>
      {/* =========================
          IMAGE
      ========================== */}

      <div className="relative h-80 overflow-hidden rounded-t-lg">
        <img
          src={image}
          alt={comic.name || "Comic"}
          className="w-full h-full object-contain"
          loading="lazy"
        />

        {/* COMIC BADGE */}

        <div
          className="
            absolute
            top-3
            left-3
            flex
            items-center
            gap-1.5
            px-2.5
            py-1
            rounded-full
            bg-[var(--secondary-color)]
            text-white
            text-xs
            font-bold
            shadow-md
          ">
          COMICS
        </div>
      </div>

      {/* =========================
          BODY
      ========================== */}

      <div className="p-4 flex flex-col flex-1">
        {/* TITLE */}

        <h3
          className="
            text-lg
            font-semibold
            text-gray-800
            dark:text-white
            mb-1
            truncate
          "
          title={comic.name}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(comic);
          }}>
          {comic.name || "Untitled Comic"}
        </h3>

        {/* COMIC LABEL + GENRE */}

        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className="
              inline-flex
              items-center
              gap-1
              text-xs
              font-bold
              text-[var(--secondary-color)]
            ">
            {/* <FaMasksTheater /> */}
            Comics
          </span>

          {comic.genre && (
            <>
              <span className="text-gray-300 dark:text-gray-600">•</span>

              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 truncate">
                {comic.genre}
              </span>
            </>
          )}
        </div>

        {/* =========================
            WRITER
        ========================== */}
{/* 
        {comic.author && (
          <p
            className="
              text-sm
              font-semibold
              text-gray-500
              dark:text-gray-400
              mb-1
              truncate
            ">
            Writer:{" "}
            <span className="text-gray-700 dark:text-gray-300">
              {comic.author}
            </span>
          </p>
        )} */}

        {/* =========================
            ARTIST
        ========================== */}

        {/* {comic.artist && (
          <p
            className="
              text-sm
              font-semibold
              text-gray-500
              dark:text-gray-400
              mb-2
              truncate
              flex
              items-center
              gap-1
            ">
            <FaPaintBrush />
            Artist:{" "}
            <span className="text-gray-700 dark:text-gray-300 truncate">
              {comic.artist}
            </span>
          </p>
        )} */}

        {/* =========================
            PUBLISHER / ISSUE / VOLUME / YEAR
        ========================== */}

        <div className="flex flex-wrap items-center gap-2 mb-2">
          {comic.publisher && (
            <span
              className="
                text-xs
                text-gray-500
                dark:text-gray-400
                truncate
              ">
              {comic.publisher}
            </span>
          )}

          {comic.issue && (
            <>
              <span className="text-gray-300 dark:text-gray-600">•</span>

              <span className="text-xs text-gray-500 dark:text-gray-400">
                Issue {comic.issue}
              </span>
            </>
          )}

          {comic.volume && (
            <>
              <span className="text-gray-300 dark:text-gray-600">•</span>

              <span className="text-xs text-gray-500 dark:text-gray-400">
                Volume {comic.volume}
              </span>
            </>
          )}
        </div>

        {/* =========================
            PAGES / LANGUAGE
        ========================== */}

        <div className="flex flex-wrap items-center gap-2 mb-2">
          {comic.pages && (
            <span
              className="
                text-xs
                text-gray-500
                dark:text-gray-400
                flex
                items-center
                gap-1
              ">
              <FaFileAlt />
              {Number(comic.pages)} pages
            </span>
          )}

          {comic.pages && comic.language && (
            <span className="text-gray-300 dark:text-gray-600">•</span>
          )}

          {comic.language && (
            <span
              className="
                text-xs
                text-gray-500
                dark:text-gray-400
                flex
                items-center
                gap-1
              ">
              <FaLanguage />

              {comic.language}
            </span>
          )}
        </div>

        {/* =========================
            CONDITION
        ========================== */}

        {comic.condition && (
          <div className="mb-2">
            <span
              className="book-condition-badge"
              data-condition={comic.condition}>
              {getBookConditionLabel(comic.condition)}
            </span>
          </div>
        )}

        {/* =========================
            PRICE
        ========================== */}

{!isRentalOnly && (
  <p
    className="
      text-base
      font-bold
      text-gray-800
      dark:text-white
      mb-1
    "
  >
    {price.toFixed(2)} ₴
  </p>
)}
{isCurrentlyRented && (
  <p className="mb-2 text-sm font-semibold text-red-600 dark:text-red-400">
    Currently rented
  </p>
)}
        {/* =========================
            LENDING
        ========================== */}

        {isLendingAvailable && lendingPrice > 0 && (
          <>
            <span className="text-xs text-gray-800 dark:text-white">
              {isRentalOnly ? "Rental price:" : "Lending price:"}
            </span>

            <p
              className="
                  text-green-600
                  dark:text-green-500
                  font-bold
                  pb-1
                ">
              {lendingPrice.toFixed(2)} ₴
            {currentComic.unit && (
  <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
    {currentComic.unit}
  </span>
)}
            </p>
            <div
              className="comic-card__rentals text-xs mb-2
                            text-gray-400
                            dark:text-gray-500">
              Successful rentals:{" "}
          <span
  className={
    Number(currentComic.successfulRentals) > 0
      ? "text-green-600 dark:text-green-500"
      : "text-gray-400 dark:text-gray-500"
  }
>
  {currentComic.successfulRentals || 0}
</span>
            </div>
          </>
        )}

        {/* =========================
            SELLER
        ========================== */}

        {seller && (
          <div
            className="
              mt-auto
              pt-3
              border-t
              border-gray-200
              dark:border-gray-700
              flex
              items-center
              space-x-3
            ">
            {/* AVATAR */}

            {sellerPhoto ? (
              <img
                src={sellerPhoto}
                alt={sellerName}
                className="
                  w-8
                  h-8
                  rounded-full
                  object-cover
                  flex-shrink-0
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
                  flex-shrink-0
                ">
                {sellerName?.charAt(0)?.toUpperCase() || <FaUser />}
              </div>
            )}

            {/* SELLER INFO */}

            <div className="min-w-0">
              <p
                className="
                  text-base
                  font-semibold
                  text-gray-800
                  dark:text-white
                  truncate
                ">
                {sellerName}
              </p>

              <p
                className="
                  text-sm
                  flex
                  items-center
                  gap-1
                  text-gray-700
                  dark:text-white
                ">
                Rating: {ratingCount > 0 ? rating.toFixed(1) : 0}
                <FaStar
                  className="
                    text-[var(--accept-color)]
                  "
                />
                {ratingCount > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({ratingCount})
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* =========================
            OWNER ACTIONS
        ========================== */}

        {isOwner && (
          <div
            className="
              flex
              gap-2
              mt-3
              pt-3
              border-t
              border-gray-200
              dark:border-gray-700
            ">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(comic);
              }}
              className="
                flex-1
                flex
                items-center
                justify-center
                gap-2
                py-1.5
                px-3
                rounded-full
                text-sm
                font-medium
                bg-gray-100
                dark:bg-gray-700
                text-gray-700
                dark:text-gray-200
                hover:bg-gray-200
                dark:hover:bg-gray-600
                transition
              ">
              <FaEdit />
              Edit
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(comic);
              }}
              className="
                flex-1
                flex
                items-center
                justify-center
                gap-2
                py-1.5
                px-3
                rounded-full
                text-sm
                font-medium
                bg-red-50
                dark:bg-red-900/20
                text-red-600
                dark:text-red-400
                hover:bg-red-100
                dark:hover:bg-red-900/30
                transition
              ">
              <FaTrash />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductComicCard;