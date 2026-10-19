import { useState, useEffect, useRef } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import {
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaQuestionCircle,
  FaBook,
} from "react-icons/fa";
import { RiAuctionFill } from "react-icons/ri";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { toast } from "react-toastify";
import TradeModal from "../trade/TradeModal";
import { getBookConditionLabel } from "../../constants/bookMeta";

import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import ImageLightbox from "../ui/ImageLightbox";

import "../../styles/bookMetaFields.scss";

const ProductModal = ({ book, onClose }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const [liveBook, setLiveBook] = useState(null);

  useEffect(() => {
    if (!book?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, "books", book.id),
      (snapshot) => {
        setLiveBook(
          snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null,
        );
      },
      (error) => {
        console.error("Error listening to book:", error);
      },
    );

    return () => unsubscribe();
  }, [book?.id]);

  const currentBook = liveBook?.id === book?.id ? liveBook : book;
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
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  if (!book) return null;

  // const productImages = book.images || [];
  const productImages = (currentBook.images || []).filter(Boolean);

  const listingType =
    currentBook.listingType ??
    ((currentBook.isLendingAvailable ?? Number(currentBook.priceLending) > 0)
      ? "sale_and_rental"
      : "sale");

  const isRentalOnly = listingType === "rental_only";
  const isLendingAvailable = listingType !== "sale";
  const isCurrentlyRented = currentBook.isCurrentlyRented === true;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isCurrentlyRented) {
      toast.error("This book is currently rented.");
      return;
    }

    if (!user) {
      toast.error("Log in to add to cart.");
      return;
    }

    if (
      isRentalOnly &&
      (!Number.isFinite(Number(currentBook.priceLending)) ||
        Number(currentBook.priceLending) <= 0)
    ) {
      toast.error("Rental price is not configured correctly.");
      return;
    }

    if (
      !isRentalOnly &&
      (currentBook.price == null ||
        !Number.isFinite(Number(currentBook.price)) ||
        Number(currentBook.price) < 0)
    ) {
      toast.error("Sale price is not configured correctly.");
      return;
    }

    addToCart({
      ...currentBook,
      type: "book",
      listingType,
      purchaseType: isRentalOnly ? "rental" : "full",
      price: isRentalOnly ? null : Number(currentBook.price),
      isLendingAvailable,
      priceLending: isLendingAvailable
        ? Number(currentBook.priceLending || 0)
        : 0,
      unit: isLendingAvailable ? currentBook.unit || null : null,
      sellerId: currentBook.sellerId ?? null,
      sellerName: currentBook.sellerName ?? "",
      sellerPhoto: currentBook.sellerPhoto ?? null,
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
          <button
            onClick={onClose}
            className="absolute top-3 right-4 z-50 p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <FaTimes className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 overflow-y-auto">
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
                    alt={`${book.name} ${idx + 1}`}
                    className="w-full h-auto rounded-lg object-cover max-h-[400px]"
                  /> */}
                    <img
                      src={img}
                      alt={`${currentBook.name} ${idx + 1}`}
                      className="w-full h-auto rounded-lg object-cover max-h-[400px] cursor-zoom-in"
                      onClick={(e) => {
                        e.stopPropagation();
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

            <div className="relative">
              <div className="flex gap-2 items-center">
                <FaBook className="text-base" />
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  {book.name}
                </h2>
              </div>
              {book.author && (
                <p className="text-gray-700 dark:text-gray-300 mb-1">
                  {" "}
                  <span className="font-semibold text-gray-500 dark:text-gray-400">
                    Author:{" "}
                  </span>
                  {book.author}
                </p>
              )}
              {book.year && (
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                  {book.year}
                </p>
              )}

              {!isRentalOnly && (
                <div className="flex gap-3 items-center">
                  <p className="text-base font-bold text-gray-800 dark:text-white">
                    Selling price: {Number(currentBook.price).toFixed(2)} ₴
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowTradeModal(true)}
                    className="
        inline-flex items-center justify-center
        w-9 h-9 rounded-full
        bg-orange-100 dark:bg-orange-900/30
        text-orange-600 dark:text-orange-400
        hover:scale-110 transition
      ">
                    <RiAuctionFill />
                  </button>
                </div>
              )}

              {isLendingAvailable && Number(currentBook.priceLending) > 0 && (
                <div className="relative mb-2 inline-block">
                  {/* <p className="text-green-600 dark:text-green-500 font-bold text-base flex items-center gap-2"> */}
                  <div className="flex gap-1">
                    <p className="text-base font-bold mb-1 text-gray-800 dark:text-white">
                      {isRentalOnly ? "Rental price:" : "Lending price:"}{" "}
                    </p>
                    <p className="text-[var(--primary-color)] font-bold text-base flex items-center gap-2">
                      {Number(currentBook.priceLending).toFixed(2)} ₴
                      <FaQuestionCircle
                        className="text-base cursor-pointer text-gray-500 hover:text-[var(--secondary-color)] transition"
                        onClick={() => setShowLendingInfo(!showLendingInfo)}
                      />
                      {book.unit && (
                        <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                          {book.unit}
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
                        Lending means you receive a book for a limited period of
                        time. The duration is specified by the seller —
                        typically 30 days. After this period, the book must be
                        returned to the seller.
                      </p>

                      <p className="mt-2">
                        All additional terms and arrangements are agreed
                        directly between you and the seller.
                      </p>

                      <p className="mt-2 text-red-500 font-medium">
                        Failure to return the book or violation of agreed terms
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
              {book.genre && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Genre: <span className="capitalize">{book.genre}</span>
                </p>
              )}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {book.pages && (
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Pages
                    </p>

                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      {Number(book.pages)}
                    </p>
                  </div>
                )}

                {book.language && (
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Language
                    </p>

                    <p className="text-sm font-semibold text-gray-800 dark:text-white">
                      {book.language}
                    </p>
                  </div>
                )}
              </div>

              {book.condition && (
                <div className="mb-4 flex items-center gap-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Condition
                  </p>

                  <span
                    className="book-condition-badge"
                    data-condition={book.condition}>
                    {getBookConditionLabel(book.condition)}
                  </span>
                </div>
              )}
              <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3 mb-4">
                <h3
                  className="
                text-sm text-gray-400 dark:text-gray-500 pb-1
              ">
                  Book description
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  {book.description}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isCurrentlyRented}
                className={`w-full py-3 px-6 rounded-full font-medium text-white transition duration-300 ${
                  isCurrentlyRented
                    ? "bg-gray-400 opacity-60 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}>
                {isCurrentlyRented
                  ? "Currently Rented"
                  : isRentalOnly
                    ? "Rent Book"
                    : "Add To Cart"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {showTradeModal && !isRentalOnly && (
        <TradeModal
          book={currentBook}
          onClose={() => setShowTradeModal(false)}
        />
      )}
      <ImageLightbox
        images={productImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(-1)}
        title={currentBook.name}
      />
    </>
  );
};

export default ProductModal;
