import { useState, useEffect, useRef } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

import {
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaQuestionCircle,
  FaDice,
} from "react-icons/fa";

import { RiAuctionFill } from "react-icons/ri";
import TradeModal from "../trade/TradeModal";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { toast } from "react-toastify";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";

import {
  getBoardGameConditionLabel,
  getBoardGameCompletenessLabel,
  getBoardGameListingType,
} from "../../constants/boardGameMeta";
import ImageLightbox from "../ui/ImageLightbox";

import "../../styles/bookMetaFields.scss";

const BoardGameModal = ({ game, onClose }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [liveGame, setLiveGame] = useState(null);
  const [showLendingInfo, setShowLendingInfo] = useState(false);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const tooltipRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const swiperRef = useRef(null);

  useEffect(() => {
    if (!game?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, "boardGames", game.id),
      (snapshot) => {
        setLiveGame(
          snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null,
        );
      },
      (error) => {
        console.error("Error listening to board game:", error);
      },
    );

    return () => unsubscribe();
  }, [game?.id]);

  const currentGame = liveGame?.id === game?.id ? liveGame : game;

  useEffect(() => {
    document.body.classList.add("no-scroll");

    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, []);

  useEffect(() => {
    if (swiperRef.current && prevRef.current && nextRef.current) {
      swiperRef.current.navigation.init();
      swiperRef.current.navigation.update();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowLendingInfo(false);
      }
    };

    if (showLendingInfo) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLendingInfo]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setShowLendingInfo(false);
      }
    };

    document.addEventListener("keydown", handleEsc);

    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  if (!game) return null;

  // const productImages = currentGame.images || [];
  const productImages = (currentGame.images || []).filter(Boolean);

  const listingType = getBoardGameListingType(currentGame);

  const isRentalOnly = listingType === "rental_only";
  const isLendingAvailable = listingType !== "sale";
  const isCurrentlyRented = currentGame.isCurrentlyRented === true;

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isCurrentlyRented) {
      toast.error("This board game is currently rented.");
      return;
    }

    if (!user) {
      toast.error("Log in to add to cart.");
      return;
    }

    if (
      isRentalOnly &&
      (!Number.isFinite(Number(currentGame.priceLending)) ||
        Number(currentGame.priceLending) <= 0)
    ) {
      toast.error("Rental price is not configured correctly.");
      return;
    }

    if (
      !isRentalOnly &&
      (currentGame.price == null ||
        !Number.isFinite(Number(currentGame.price)) ||
        Number(currentGame.price) < 0)
    ) {
      toast.error("Sale price is not configured correctly.");
      return;
    }

    addToCart({
      ...currentGame,
      type: "boardGame",
      listingType,

      purchaseType: isRentalOnly ? "rental" : "full",

      price: isRentalOnly ? null : Number(currentGame.price),

      isLendingAvailable,

      priceLending: isLendingAvailable
        ? Number(currentGame.priceLending || 0)
        : 0,

      unit: isLendingAvailable ? currentGame.unit || null : null,

      sellerId: currentGame.sellerId ?? null,
      sellerName: currentGame.sellerName ?? "",
      sellerPhoto: currentGame.sellerPhoto ?? null,

      quantity: 1,
    });

    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
        onClick={onClose}>
        <div
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(event) => event.stopPropagation()}>
          <button
            onClick={onClose}
            className="absolute top-3 right-4 z-50 p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <FaTimes className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto">
            {/* IMAGES */}
            <div className="flex justify-center relative w-full max-w-md max-h-[400px] mt-5">
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={10}
                slidesPerView={1}
                loop={productImages.length > 1}
                pagination={{ clickable: true }}
                navigation={{
                  prevEl: prevRef.current,
                  nextEl: nextRef.current,
                }}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;

                  setTimeout(() => {
                    if (swiperRef.current) {
                      swiperRef.current.params.navigation.prevEl =
                        prevRef.current;

                      swiperRef.current.params.navigation.nextEl =
                        nextRef.current;

                      swiperRef.current.navigation.destroy();
                      swiperRef.current.navigation.init();
                      swiperRef.current.navigation.update();
                    }
                  }, 0);
                }}
                className="modal-swiper w-full h-full">
                {productImages.map((image, index) => (
                  <SwiperSlide
                    key={index}
                    className="flex justify-center items-center pb-4">
                    {/* <img
                      src={image}
                      alt={`${currentGame.name} ${index + 1}`}
                      className="w-full h-auto rounded-lg object-cover max-h-[400px]"
                    /> */}
                    <img
                      src={image}
                      alt={`${currentGame.name} ${index + 1}`}
                      className="w-full h-auto rounded-lg object-cover max-h-[400px] cursor-zoom-in"
                      onClick={(e) => {
                        e.stopPropagation();

                        if (swiperRef.current?.allowClick === false) return;

                        setLightboxIndex(index);
                      }}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>

              <button
                ref={prevRef}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                <FaArrowLeft />
              </button>

              <button
                ref={nextRef}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
                <FaArrowRight />
              </button>
            </div>

            {/* GAME DETAILS */}
            <div className="relative">
              <div className="flex gap-2 items-center mb-2">
                <FaDice className="text-xl" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  {currentGame.name}
                </h2>
              </div>
              {/* {currentGame.author && (
                <p className="text-gray-700 dark:text-gray-300 mb-1">
                  <strong className="font-semibold text-gray-500 dark:text-gray-400">Game Designer:</strong>{" "}
                  {currentGame.author}
                </p>
              )} */}
              {currentGame.publisher && (
                <p className="text-gray-700 dark:text-gray-300 mb-1">
                  {currentGame.publisher}
                </p>
              )}

              {currentGame.year && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                  {currentGame.year}
                </p>
              )}

              {!isRentalOnly && (
                <div className="flex gap-3 items-center">
                  <p className="text-base font-bold text-gray-800 dark:text-white">
                    Selling price: {Number(currentGame.price).toFixed(2)} ₴
                  </p>

                  {!isCurrentlyRented &&
                    user?.uid !== currentGame.sellerId &&
                    Number(currentGame.price) > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsTradeModalOpen(true)}
                        title="Make an Offer"
                        aria-label="Make an Offer"
                        className="
            inline-flex items-center justify-center
            w-9 h-9 rounded-full
            bg-orange-100 dark:bg-orange-900/30
            text-orange-600 dark:text-orange-400
            hover:scale-110 transition
          ">
                        <RiAuctionFill />
                      </button>
                    )}
                </div>
              )}

              {isLendingAvailable && Number(currentGame.priceLending) > 0 && (
                <div className="relative mb-2 inline-block">
                  <div className="flex gap-1">
                    <p className="text-base font-bold mb-1 text-gray-800 dark:text-white">
                      {isRentalOnly ? "Rental price:" : "Lending price:"}
                    </p>

                    <p className="text-[var(--primary-color)] font-bold text-base flex items-center gap-2">
                      {Number(currentGame.priceLending).toFixed(2)} ₴
                      <FaQuestionCircle
                        className="text-base cursor-pointer text-gray-500 hover:text-[var(--secondary-color)] transition"
                        onClick={() => setShowLendingInfo(!showLendingInfo)}
                      />
                      {currentGame.unit && (
                        <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                          {currentGame.unit}
                        </span>
                      )}
                    </p>
                  </div>

                  {showLendingInfo && (
                    <div
                      ref={tooltipRef}
                      className="absolute top-8 left-0 w-80 p-4 rounded-lg shadow-xl bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 z-50">
                      <p className="font-semibold mb-2">What is Lending?</p>

                      <p>
                        Lending allows you to rent this board game for the
                        period specified by the seller.
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Successful rentals:{" "}
                    <span
                      className={
                        Number(currentGame.successfulRentals) > 0
                          ? "text-green-600 dark:text-green-500"
                          : "text-gray-400 dark:text-gray-500"
                      }>
                      {currentGame.successfulRentals || 0}
                    </span>
                  </p>
                </div>
              )}

              {isCurrentlyRented && (
                <p className="mb-3 text-sm font-semibold text-red-600 dark:text-red-400">
                  Currently rented
                </p>
              )}

              {/* BOARD GAME PARAMETERS */}
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 my-4">
                {/* {currentGame.author && (
                  <p>
                    <strong>Designer:</strong>{" "}
                    {currentGame.author}
                  </p>
                )} */}
                {currentGame.category && (
                  <p>
                    <strong>Category:</strong> {currentGame.category}
                  </p>
                )}

                {currentGame.minPlayers != null &&
                  currentGame.maxPlayers != null && (
                    <p>
                      <strong>Players:</strong> {currentGame.minPlayers}–
                      {currentGame.maxPlayers}
                    </p>
                  )}

                {currentGame.playTime != null && (
                  <p>
                    <strong>Playing time:</strong> {currentGame.playTime}{" "}
                    minutes
                  </p>
                )}

                {currentGame.minAge != null && (
                  <p>
                    <strong>Recommended age:</strong> {currentGame.minAge}+
                  </p>
                )}

                {currentGame.language && (
                  <p>
                    <strong>Language:</strong> {currentGame.language}
                  </p>
                )}

                {currentGame.condition && (
                  <div>
                    <strong>Condition:</strong>{" "}
                    <span
                      className="book-condition-badge"
                      data-condition={currentGame.condition}>
                      {getBoardGameConditionLabel(currentGame.condition)}
                    </span>
                  </div>
                )}

                {currentGame.completeness && (
                  <p>
                    <strong>Completeness:</strong>{" "}
                    {getBoardGameCompletenessLabel(currentGame.completeness)}
                  </p>
                )}
              </div>

              {currentGame.description && (
                <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-line mb-4">
                  {currentGame.description}
                </p>
              )}

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isCurrentlyRented}
                className={`w-full py-3 px-6 rounded-full font-medium text-white transition duration-300 ${
                  isCurrentlyRented
                    ? "bg-gray-400 opacity-60 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}>
                {isCurrentlyRented ? "Currently Rented" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {isTradeModalOpen && (
        <TradeModal
          book={{
            ...currentGame,
            type: "boardGame",
          }}
          onClose={() => setIsTradeModalOpen(false)}
        />
      )}
      <ImageLightbox
        images={productImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(-1)}
        title={currentGame.name}
      />
    </>
  );
};

export default BoardGameModal;
