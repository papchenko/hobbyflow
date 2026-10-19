import { useState, useEffect, useRef } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import {
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaQuestionCircle,
} from "react-icons/fa";
import { BsFileImage } from "react-icons/bs";
import { RiAuctionFill } from "react-icons/ri";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { toast } from "react-toastify";
import TradeModal from "../trade/TradeModal";
import ImageLightbox from "../ui/ImageLightbox";

import { getBookConditionLabel } from "../../constants/bookMeta";

import "../../styles/bookMetaFields.scss";

const ProductComicModal = ({ comic, onClose }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [liveComic, setLiveComic] = useState(null);
  const [comicLoading, setComicLoading] = useState(true);
  const [comicExists, setComicExists] = useState(true);

  useEffect(() => {
    if (!comic?.id) {
      setComicLoading(false);
      return;
    }

    setComicLoading(true);

    const unsubscribe = onSnapshot(
      doc(db, "comics", comic.id),
      (snapshot) => {
        setComicExists(snapshot.exists());

        setLiveComic(
          snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null,
        );

        setComicLoading(false);
      },
      (error) => {
        console.error("Error listening to comic:", error);
        setComicLoading(true);
      },
    );

    return () => unsubscribe();
  }, [comic?.id]);

  const currentComic = liveComic?.id === comic?.id ? liveComic : comic;
  const tooltipRef = useRef(null);

  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const swiperRef = useRef(null);

  const [showLendingInfo, setShowLendingInfo] = useState(false);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

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
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowLendingInfo(false);
      }
    };

    document.addEventListener("keydown", handleEsc);

    return () => {
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  if (!comic) return null;

  // const productImages = comic.images || [];
  const productImages = (currentComic.images || []).filter(Boolean);

  const listingType =
    currentComic.listingType ??
    ((currentComic.isLendingAvailable ?? Number(currentComic.priceLending) > 0)
      ? "sale_and_rental"
      : "sale");

  const isRentalOnly = listingType === "rental_only";
  const isLendingAvailable = listingType !== "sale";
  const isCurrentlyRented = currentComic.isCurrentlyRented === true;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (comicLoading || !comicExists) {
      toast.error("Comic availability could not be verified.");
      return;
    }

    if (isCurrentlyRented) {
      toast.error("This comic is currently rented.");
      return;
    }

    if (!user) {
      toast.error("Log in to add to cart.");
      return;
    }

    if (
      isRentalOnly &&
      (currentComic.priceLending == null ||
        !Number.isFinite(Number(currentComic.priceLending)) ||
        Number(currentComic.priceLending) <= 0)
    ) {
      toast.error("Rental price is not configured correctly.");
      return;
    }

    if (
      !isRentalOnly &&
      (currentComic.price == null ||
        !Number.isFinite(Number(currentComic.price)) ||
        Number(currentComic.price) < 0)
    ) {
      toast.error("Sale price is not configured correctly.");
      return;
    }

    addToCart({
      ...currentComic,
      type: "comic",
      listingType,
      purchaseType: isRentalOnly ? "rental" : "full",
      price: isRentalOnly ? null : Number(currentComic.price),
      isLendingAvailable,
      priceLending: isLendingAvailable
        ? Number(currentComic.priceLending || 0)
        : 0,
      unit: isLendingAvailable ? currentComic.unit || null : null,
      sellerId: currentComic.sellerId ?? null,
      sellerName: currentComic.sellerName ?? "",
      sellerPhoto: currentComic.sellerPhoto ?? null,
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
          onClick={(e) => e.stopPropagation()}>
          {/* COMIC LABEL */}
          {/* <div
            className="
              absolute top-3 left-4 z-50
              px-3 py-1
              rounded-full
              text-xs font-bold
              uppercase tracking-wide
              bg-[var(--primary-color)]
              text-white
              shadow-md
            "
          >
            COMIC
          </div> */}

          <button
            onClick={onClose}
            className="absolute top-3 right-4 z-50 p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <FaTimes className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto">
            {/* IMAGE */}
            <div className="flex justify-center relative w-full max-w-md max-h-[400px] mt-5">
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={10}
                slidesPerView={1}
                loop
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
                {productImages.map((img, idx) => (
                  <SwiperSlide
                    key={idx}
                    className="flex justify-center items-center pb-4">
                    {/* <img
                      src={img}
                      alt={`${comic.name} ${idx + 1}`}
                      className="w-full h-auto rounded-lg object-cover max-h-[400px]"
                    /> */}
                    <img
                      src={img}
                      alt={`${currentComic.name} ${idx + 1}`}
                      className="w-full h-auto rounded-lg object-cover max-h-[400px] cursor-zoom-in"
                      onClick={(e) => {
                        e.stopPropagation();

                        if (swiperRef.current?.allowClick === false) return;

                        setLightboxIndex(idx);
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

            {/* INFO */}
            <div className="relative">
              <div className="flex gap-2 items-center mb-2">
                <BsFileImage className="text-base" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {comic.name}
                </h2>
              </div>
              {comic.author && (
                <p className="text-gray-700 dark:text-gray-300 mb-1">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Writer:{" "}
                  </span>
                  {comic.author}
                </p>
              )}

              {comic.artist && (
                <p className="text-gray-700 dark:text-gray-300 mb-1">
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">
                    Artist:{" "}
                  </span>{" "}
                  {comic.artist}
                </p>
              )}

              {comic.year && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                  {comic.year}
                </p>
              )}

              {!isRentalOnly && (
                <div className="flex gap-3 items-center">
                  <p className="text-base font-bold text-gray-800 dark:text-white">
                    Selling price: {Number(currentComic.price).toFixed(2)} ₴
                  </p>

                  <button
                    onClick={() => setShowTradeModal(true)}
                    className="
        inline-flex
        items-center
        justify-center
        w-9
        h-9
        rounded-full
        bg-orange-100
        dark:bg-orange-900/30
        text-orange-600
        dark:text-orange-400
        hover:scale-110
        transition
      ">
                    <RiAuctionFill />
                  </button>
                </div>
              )}

              {isLendingAvailable && Number(comic.priceLending) > 0 && (
                <div className="relative mb-2 inline-block">
                  <div className="flex gap-1">
                    <p className="text-base font-bold mb-1 text-gray-800 dark:text-white">
                      {isRentalOnly ? "Rental price:" : "Lending price:"}
                    </p>

                    <p className="text-[var(--primary-color)] font-bold text-base flex items-center gap-2">
                      {Number(comic.priceLending).toFixed(2)} ₴
                      <FaQuestionCircle
                        className="text-base cursor-pointer text-gray-500 hover:text-[var(--secondary-color)] transition"
                        onClick={() => setShowLendingInfo(!showLendingInfo)}
                      />
                      {comic.unit && (
                        <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                          {comic.unit}
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
                        Lending means you receive a comic for a limited period
                        of time. The duration is specified by the seller —
                        typically 30 days. After this period, the comic must be
                        returned to the seller.
                      </p>

                      <p className="mt-2">
                        All additional terms and arrangements are agreed
                        directly between you and the seller.
                      </p>

                      <p className="mt-2 text-red-500 font-medium">
                        Failure to return the comic or violation of agreed terms
                        will result in permanent account suspension.
                      </p>

                      <p className="mt-2 font-medium">
                        We wish you a pleasant reading experience!
                      </p>

                      <button
                        onClick={() => setShowLendingInfo(false)}
                        className="mt-4 w-full py-2 rounded-md bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm font-medium">
                        Close
                      </button>
                    </div>
                  )}
                </div>
              )}

              {comic.genre && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Genre: <span className="capitalize">{comic.genre}</span>
                </p>
              )}

              {/* COMIC INFO */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {comic.pages && (
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Pages
                    </p>

                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      {Number(comic.pages)}
                    </p>
                  </div>
                )}

                {comic.language && (
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Language
                    </p>

                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      {comic.language}
                    </p>
                  </div>
                )}

                {comic.issue && (
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Issue
                    </p>

                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      #{comic.issue}
                    </p>
                  </div>
                )}

                {comic.volume && (
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Volume
                    </p>

                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      {comic.volume}
                    </p>
                  </div>
                )}
              </div>

              {comic.condition && (
                <div className="mb-4 flex items-center gap-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Condition
                  </p>

                  <span
                    className="book-condition-badge"
                    data-condition={comic.condition}>
                    {getBookConditionLabel(comic.condition)}
                  </span>
                </div>
              )}

              <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3 mb-4">
                <h3
                  className="
                    text-sm text-gray-400 dark:text-gray-500 pb-1
                  ">
                  Comic description
                </h3>

                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  {comic.description}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={comicLoading || !comicExists || isCurrentlyRented}
                className={`w-full py-3 px-6 rounded-full font-medium text-white transition duration-300 ${
                  comicLoading || !comicExists || isCurrentlyRented
                    ? "bg-gray-400 opacity-60 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}>
                {comicLoading
                  ? "Checking availability..."
                  : !comicExists
                    ? "Comic unavailable"
                    : isCurrentlyRented
                      ? "Currently Rented"
                      : isRentalOnly
                        ? "Rent Comic"
                        : "Add To Cart"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showTradeModal && !comicLoading && comicExists && !isRentalOnly && (
        <TradeModal
          book={currentComic}
          onClose={() => setShowTradeModal(false)}
        />
      )}
      <ImageLightbox
        images={productImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(-1)}
        title={currentComic.name}
      />
    </>
  );
};

export default ProductComicModal;
