import { useEffect, useRef, useState } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

import {
  FaTimes,
  FaArrowLeft,
  FaArrowRight,
  FaBook,
  FaFileAlt,
  FaGlobe,
  FaLayerGroup,
  FaCalendarAlt,
} from "react-icons/fa";
import { SiBookstack } from "react-icons/si";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { toast } from "react-toastify";
import { RiAuctionFill } from "react-icons/ri";

import TradeModal from "../trade/TradeModal";
import { getBookConditionLabel } from "../../constants/bookMeta";
import ImageLightbox from "../ui/ImageLightbox";

const ProductCollectionModal = ({ collection, onClose }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const swiperRef = useRef(null);
  const nestedSwiperRef = useRef(null);

  const [showTradeModal, setShowTradeModal] = useState(false);

  const [selectedBook, setSelectedBook] = useState(null);
  const [lightboxImages, setLightboxImages] = useState([]);
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

  if (!collection) return null;

  const books = Array.isArray(collection.books) ? collection.books : [];
  const getBookImages = (book) => {
    if (Array.isArray(book?.images) && book.images.length > 0) {
      return book.images.filter(Boolean).slice(0, 3);
    }

    if (book?.image) {
      return [book.image];
    }

    return [];
  };

  const openLightbox = (images, index = 0) => {
    const validImages = (images || []).filter(Boolean);

    if (!validImages.length) return;

    setLightboxImages(validImages);
    setLightboxIndex(index);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();

    if (!user) {
      toast.error("Log in to add to cart");
      return;
    }

    addToCart({
      id: collection.id,

      collectionId: collection.collectionId || collection.id,

      type: "collection",

      name: collection.collectionName || collection.name || "Book Collection",

      collectionName:
        collection.collectionName || collection.name || "Book Collection",

      image:
        collection.image ||
        collection.images?.[0] ||
        collection.books?.[0]?.image ||
        collection.books?.[0]?.images?.[0] ||
        "",

      price: Number(collection.price ?? 0),

      books: Array.isArray(collection.books) ? collection.books : [],

      bookCount: Number(collection.bookCount ?? collection.books?.length ?? 0),

      collection,

      quantity: 1,

      purchaseType: "full",

      finalPrice:
        collection.finalPrice != null ? Number(collection.finalPrice) : null,

      tradeId: collection.tradeId ?? null,

      isTrade: collection.isTrade === true,

      sellerId: collection.sellerId ?? null,

      sellerName: collection.sellerName ?? null,

      sellerPhoto: collection.sellerPhoto ?? null,
    });

    onClose();
  };

  const getConditionClass = (condition) =>
    `book-condition-badge ${condition ? "" : "bg-gray-100 text-gray-500"}`;

  return (
    <>
      {/* =====================================================
          COLLECTION MODAL
      ===================================================== */}

      <div
        className="
          fixed
          inset-0
          z-50
          flex
          items-center
          justify-center
          bg-black/60
          backdrop-blur-sm
          p-3
          md:p-5
        "
        onClick={onClose}>
        <div
          className="
            relative
            bg-white
            dark:bg-gray-800
            rounded-2xl
            shadow-2xl
            w-[96vw]
            max-w-6xl
            max-h-[94vh]
            overflow-hidden
            flex
            flex-col
          "
          onClick={(e) => e.stopPropagation()}>
          {/* =====================================================
              CLOSE
          ===================================================== */}

          <button
            onClick={onClose}
            className="
              absolute
              top-3
              right-3
              z-50
              p-2.5
              rounded-full
              bg-white/90
              dark:bg-gray-700/90
              text-gray-700
              dark:text-gray-200
              shadow-md
              hover:bg-gray-100
              dark:hover:bg-gray-600
              transition
            "
            aria-label="Close collection">
            <FaTimes className="w-5 h-5" />
          </button>

          {/* =====================================================
              MAIN CONTENT
          ===================================================== */}

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              gap-6
              p-5
              md:p-7
              overflow-y-auto
              min-w-0
            ">
            {/* =================================================
                SWIPER
            ================================================== */}

            <div
              className="
                relative
                w-full
                min-w-0
                flex
                flex-col
                justify-center
              ">
              <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={10}
                slidesPerView={1}
                loop={books.length > 1}
                pagination={{
                  clickable: true,
                }}
                navigation={{
                  prevEl: prevRef.current,
                  nextEl: nextRef.current,
                }}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;

                  setTimeout(() => {
                    if (!swiperRef.current) return;

                    swiperRef.current.params.navigation.prevEl =
                      prevRef.current;

                    swiperRef.current.params.navigation.nextEl =
                      nextRef.current;

                    swiperRef.current.navigation.destroy();
                    swiperRef.current.navigation.init();
                    swiperRef.current.navigation.update();
                  }, 0);
                }}
                className="
                  w-full
                  collection-modal-swiper
                ">
                {books.map((book, index) => (
                  <SwiperSlide
                    key={`${book.title}-${index}`}
                    className="
                      flex
                      flex-col
                      justify-center
                      items-center
                      px-8
                      pb-5
                    ">
                    {/* COVER */}

                    <div
                      className="
                        w-full
                        h-[360px]
                        md:h-[430px]
                        flex
                        items-center
                        justify-center
                      ">
                      {/* <img
                        src={
                          book.image ||
                          book.images?.[0] ||
                          ""
                        }
                        alt={
                          book.title ||
                          "Book cover"
                        }
                        className="
                          max-w-full
                          max-h-full
                          object-contain
                          rounded-xl
                          shadow-xl
                        "
                      /> */}
                      <img
                        src={getBookImages(book)[0] || ""}
                        alt={book.title || "Book cover"}
                        className="
                          max-w-full
                          max-h-full
                          object-contain
                          rounded-xl
                          
                        "
                      />
                      {/* <img
                        src={getBookImages(book)[0] || ""}
                        alt={book.title || "Book cover"}
                        className="max-w-full max-h-full object-contain rounded-xl cursor-zoom-in"
                        onClick={(e) => {
                          e.stopPropagation();

                          if (swiperRef.current?.allowClick === false) return;

                          openLightbox(getBookImages(book), 0);
                        }}
                      /> */}
                    </div>

                    {/* SLIDE INFO */}

                    <div className="w-full mt-5 text-center">
                      <h3
                        className="
                          text-lg
                          md:text-xl
                          font-bold
                          text-gray-800
                          dark:text-white
                        ">
                        {book.title}
                      </h3>

                      {book.author && (
                        <p
                          className="
                            mt-1
                            text-sm
                            text-gray-500
                            dark:text-gray-400
                          ">
                          {book.author}
                        </p>
                      )}

                      <div
                        className="
                          flex
                          flex-wrap
                          items-center
                          justify-center
                          gap-2
                          mt-3
                          mb-3
                        ">
                        {book.year && (
                          <span
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              px-2.5
                              py-1
                              rounded-full
                              bg-gray-100
                              dark:bg-gray-700
                              text-xs
                              text-gray-600
                              dark:text-gray-300
                            ">
                            Publication year: {/* <FaCalendarAlt /> */}
                            {book.year}
                          </span>
                        )}

                        {book.pages != null && (
                          <span
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              px-2.5
                              py-1
                              rounded-full
                              bg-gray-100
                              dark:bg-gray-700
                              text-xs
                              text-gray-600
                              dark:text-gray-300
                            ">
                            {/* <FaFileAlt /> */}
                            {Number(book.pages)} pages
                          </span>
                        )}

                        {book.language && (
                          <span
                            className="
                              inline-flex
                              items-center
                              gap-1.5
                              px-2.5
                              py-1
                              rounded-full
                              bg-gray-100
                              dark:bg-gray-700
                              text-xs
                              text-gray-600
                              dark:text-gray-300
                            ">
                            Language: {/* <FaGlobe /> */}
                            {book.language}
                          </span>
                        )}
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* DESKTOP NAVIGATION */}

              {books.length > 1 && (
                <>
                  <button
                    ref={prevRef}
                    className="
                      hidden
                      md:flex
                      absolute
                      left-0
                      top-[42%]
                      -translate-y-1/2
                      z-10
                      w-10
                      h-10
                      items-center
                      justify-center
                      rounded-full
                      bg-white
                      dark:bg-gray-700
                      text-gray-800
                      dark:text-white
                      shadow-lg
                      hover:scale-105
                      transition
                    "
                    aria-label="Previous book">
                    <FaArrowLeft />
                  </button>

                  <button
                    ref={nextRef}
                    className="
                      hidden
                      md:flex
                      absolute
                      right-0
                      top-[42%]
                      -translate-y-1/2
                      z-10
                      w-10
                      h-10
                      items-center
                      justify-center
                      rounded-full
                      bg-white
                      dark:bg-gray-700
                      text-gray-800
                      dark:text-white
                      shadow-lg
                      hover:scale-105
                      transition
                    "
                    aria-label="Next book">
                    <FaArrowRight />
                  </button>
                </>
              )}
            </div>

            {/* =================================================
                COLLECTION INFO
            ================================================== */}

            <div className="relative min-w-0">
              {/* BOOK COUNT */}

              {/* <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  mb-3
                  px-3
                  py-1.5
                  rounded-full
                  bg-[var(--primary-color)]/10
                  text-[var(--primary-color)]
                "
              >
                <FaBook />

                <span className="text-sm font-semibold">
                  {collection.bookCount ??
                    books.length}{" "}
                  books
                </span>
              </div> */}

              {/* TITLE */}

              <div className="flex gap-2 items-center mb-2">
                <SiBookstack className="text-xl" />
                <h2
                  className="
                  text-2xl
                  md:text-3xl
                  font-bold
                  text-gray-800
                  dark:text-white
                  mb-2
                ">
                  {collection.collectionName}
                </h2>
              </div>

              {/* SERIES */}

              {collection.seriesName && (
                <p
                  className="
                    text-gray-700
                    dark:text-gray-300
                    mb-1
                  ">
                  <span className="font-semibold">Series:</span>{" "}
                  {collection.seriesName}
                </p>
              )}

              {/* AUTHOR */}

              {collection.author && (
                <p
                  className="
                    text-gray-700
                    dark:text-gray-300
                    mb-1
                  ">
                  <span className="font-semibold">Author:</span>{" "}
                  {collection.author}
                </p>
              )}

              {/* GENRE */}

              {collection.genre && (
                <p
                  className="
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                    mb-4
                  ">
                  {collection.genre}
                </p>
              )}

              {/* COMPLETENESS */}

              {collection.completenessLabel && (
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    px-3
                    py-1.5
                    rounded-full
                    bg-purple-100
                    dark:bg-purple-900/40
                    text-purple-700
                    dark:text-purple-300
                    text-sm
                    font-semibold
                    mb-5
                  ">
                  <FaLayerGroup />

                  {collection.completenessLabel}
                </div>
              )}

              {/* PRICE CARD */}

              <div
                className="
                  mb-5
                  p-4
                  rounded-2xl
                  border
                  border-gray-200
                  dark:border-gray-700
                  bg-gray-50
                  dark:bg-gray-900/40
                ">
                <p
                  className="
                    text-sm
                    text-gray-500
                    dark:text-gray-400
                  ">
                  Collection price
                </p>

                <div className="flex items-center gap-3 mt-1">
                  <p
                    className="
                      text-3xl
                      font-bold
                      text-gray-800
                      dark:text-white
                    ">
                    {Number(collection.price ?? 0).toFixed(2)} ₴
                  </p>

                  <button
                    type="button"
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
                    "
                    title="Trade">
                    <RiAuctionFill />
                  </button>
                </div>

                <p
                  className="
                    text-xs
                    text-gray-500
                    dark:text-gray-400
                    mt-1
                  ">
                  Price for the entire collection
                </p>
              </div>

              {/* COLLECTION DESCRIPTION */}

              {collection.description && (
                <div
                  className="
                    mb-6
                    p-4
                    rounded-2xl
                    bg-gray-50
                    dark:bg-gray-900/40
                    border
                    border-gray-200
                    dark:border-gray-700
                  ">
                  <p
                    className="
                      text-xs
                      uppercase
                      tracking-wider
                      font-bold
                      text-gray-400
                      dark:text-gray-500
                      mb-2
                    ">
                    Collection description
                  </p>

                  <p
                    className="
                      text-sm
                      leading-6
                      text-gray-700
                      dark:text-gray-300
                      whitespace-pre-line
                      break-words
                    ">
                    {collection.description}
                  </p>
                </div>
              )}

              {/* =================================================
                  BOOKS INCLUDED
              ================================================== */}

              <div className="mb-6">
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                    mb-3
                  ">
                  <h3
                    className="
                      text-lg
                      font-bold
                      text-gray-800
                      dark:text-white
                    ">
                    Books included
                  </h3>

                  <span
                    className="
                      text-xs
                      font-semibold
                      text-gray-400
                      dark:text-gray-500
                    ">
                    {books.length} total
                  </span>
                </div>

                <div
                  className="
                    grid
                    grid-cols-1
                    gap-3
                    max-h-[420px]
                    overflow-y-auto
                    pr-1
                  ">
                  {books.map((book, index) => (
                    <button
                      key={`${book.title}-list-${index}`}
                      type="button"
                      onClick={() => setSelectedBook(book)}
                      className="
                        group
                        w-full
                        text-left
                        flex
                        gap-3
                        p-3
                        rounded-2xl
                        border
                        border-gray-200
                        dark:border-gray-700
                        bg-gray-50
                        dark:bg-gray-900/40
                        hover:border-[var(--primary-color)]
                        hover:shadow-md
                        transition-all
                      ">
                      {/* NUMBER */}

                      <div
                        className="
                          shrink-0
                          w-7
                          flex
                          items-center
                          justify-center
                        ">
                        <span
                          className="
                            w-6
                            h-6
                            rounded-full
                            bg-gray-200
                            dark:bg-gray-700
                            text-xs
                            font-bold
                            text-gray-500
                            dark:text-gray-300
                            flex
                            items-center
                            justify-center
                          ">
                          {index + 1}
                        </span>
                      </div>

                      {/* COVER */}

                      <img
                        src={book.image || book.images?.[0] || ""}
                        alt={book.title}
                        className="
                          w-14
                          h-20
                          object-cover
                          rounded-lg
                          shadow-sm
                          shrink-0
                        "
                      />

                      {/* CONTENT */}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p
                              className="
                                font-semibold
                                text-sm
                                text-gray-800
                                dark:text-white
                                truncate
                              ">
                              {book.title || "Untitled book"}
                            </p>

                            {book.author && (
                              <p
                                className="
                                  text-xs
                                  text-gray-500
                                  dark:text-gray-400
                                  mt-0.5
                                  truncate
                                ">
                                {book.author}
                              </p>
                            )}
                          </div>

                          <span
                            className="
                              shrink-0
                              text-[var(--primary-color)]
                              opacity-0
                              group-hover:opacity-100
                              transition
                              text-sm
                            ">
                            →
                          </span>
                        </div>

                        {/* META */}

                        <div
                          className="
                            flex
                            flex-wrap
                            gap-1.5
                            mt-2
                          ">
                          {book.pages != null && (
                            <span
                              className="
                                text-[11px]
                                px-2
                                py-0.5
                                rounded-full
                                bg-gray-200
                                dark:bg-gray-700
                                text-gray-600
                                dark:text-gray-300
                              ">
                              {Number(book.pages)} pages
                            </span>
                          )}

                          {book.language && (
                            <span
                              className="
                                text-[11px]
                                px-2
                                py-0.5
                                rounded-full
                                bg-gray-200
                                dark:bg-gray-700
                                text-gray-600
                                dark:text-gray-300
                              ">
                              {book.language}
                            </span>
                          )}

                          {/* {book.condition && (
                            <span
                              className="book-condition-badge"
                              data-condition={
                                book.condition
                              }
                            >
                              {getBookConditionLabel(
                                book.condition
                              )}
                            </span>
                          )} */}
                        </div>

                        {/* DESCRIPTION PREVIEW */}

                        {book.description && (
                          <p
                            className="
                              mt-2
                              text-xs
                              leading-5
                              text-gray-500
                              dark:text-gray-400
                              line-clamp-2
                            ">
                            {book.description}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* CART */}

              <button
                onClick={handleAddToCart}
                className="
                  w-full
                  py-3.5
                  px-6
                  rounded-full
                  font-semibold
                  bg-green-600
                  hover:bg-green-700
                  text-white
                  shadow-lg
                  hover:shadow-xl
                  transition-all
                ">
                Add Collection To Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          INDIVIDUAL BOOK MODAL
      ===================================================== */}

      {selectedBook && (
        <div
          className="
            fixed
            inset-0
            z-[60]
            flex
            items-center
            justify-center
            bg-black/70
            backdrop-blur-sm
            p-4
          "
          onClick={() => setSelectedBook(null)}>
          <div
            className="
              relative
              w-full
              max-w-4xl
              max-h-[90vh]
              overflow-y-auto
              bg-white
              dark:bg-gray-800
              rounded-2xl
              shadow-2xl
              p-5
              md:p-7
            "
            onClick={(e) => e.stopPropagation()}>
            {/* CLOSE */}

            <button
              type="button"
              onClick={() => setSelectedBook(null)}
              className="
                absolute
                top-3
                right-3
                z-10
                p-2.5
                rounded-full
                bg-gray-100
                dark:bg-gray-700
                text-gray-700
                dark:text-gray-200
                hover:bg-gray-200
                dark:hover:bg-gray-600
                transition
              "
              aria-label="Close book details">
              <FaTimes />
            </button>

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-[280px_1fr]
                gap-6
              ">
              {/* BOOK IMAGE */}

              <div
                className="
                  flex
                  items-start
                  justify-center
                ">
                <div
                  className="
    relative
    w-full
    max-w-[300px]
  ">
                  <Swiper
                    modules={[Navigation, Pagination]}
                    spaceBetween={12}
                    slidesPerView={1}
                    loop={getBookImages(selectedBook).length > 1}
                    onSwiper={(swiper) => {
                      nestedSwiperRef.current = swiper;
                    }}
                    onBeforeDestroy={(swiper) => {
                      if (nestedSwiperRef.current === swiper) {
                        nestedSwiperRef.current = null;
                      }
                    }}
                    pagination={{
                      clickable: true,
                    }}
                    className="
      w-full
      overflow-hidden
      rounded-2xl
    ">
                    {getBookImages(selectedBook).map((image, imageIndex) => (
                      <SwiperSlide key={`${image}-${imageIndex}`}>
                        <div
                          className="
            aspect-[2/3]
            rounded-2xl
            overflow-hidden
            
          ">
                          {/* 
            shadow-xl
            bg-gray-100
            dark:bg-gray-900
             */}
                          <img
                            src={image}
                            alt={`${selectedBook.title} ${imageIndex + 1}`}
                            className="w-full h-full object-contain cursor-zoom-in"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLightbox(
                                getBookImages(selectedBook),
                                imageIndex,
                              );
                            }}
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                  {/* NESTED SWIPER DESKTOP NAVIGATION */}
                  {getBookImages(selectedBook).length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          nestedSwiperRef.current?.slidePrev();
                        }}
                        className="
        hidden md:flex
        absolute left-0 top-1/2 -translate-y-1/2
        z-10
        w-10 h-10
        items-center justify-center
        rounded-full
        bg-white dark:bg-gray-700
        text-gray-800 dark:text-white
        shadow-lg
        hover:scale-105
        transition
      "
                        aria-label="Previous photo">
                        <FaArrowLeft />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          nestedSwiperRef.current?.slideNext();
                        }}
                        className="
        hidden md:flex
        absolute right-0 top-1/2 -translate-y-1/2
        z-10
        w-10 h-10
        items-center justify-center
        rounded-full
        bg-white dark:bg-gray-700
        text-gray-800 dark:text-white
        shadow-lg
        hover:scale-105
        transition
      "
                        aria-label="Next photo">
                        <FaArrowRight />
                      </button>
                    </>
                  )}

                  {/* {getBookImages(
    selectedBook,
  ).length > 1 && (
    <div
      className="
        text-center
        mt-2
        text-xs
        text-gray-400
        dark:text-gray-500
      "
    >
      {getBookImages(
        selectedBook,
      ).length} photos
    </div>
  )} */}
                </div>
              </div>

              {/* BOOK DATA */}

              <div className="min-w-0">
                <p
                  className="
                    text-xs
                    uppercase
                    tracking-widest
                    font-bold
                    text-[var(--primary-color)]
                    mb-2
                  ">
                  Book {books.findIndex((book) => book === selectedBook) + 1} of{" "}
                  {books.length}
                </p>

                <h2
                  className="
                    text-2xl
                    md:text-3xl
                    font-bold
                    text-gray-800
                    dark:text-white
                  ">
                  {selectedBook.title || "Untitled book"}
                </h2>

                {selectedBook.author && (
                  <p
                    className="
                      mt-1
                      text-base
                      text-gray-500
                      dark:text-gray-400
                    ">
                    {selectedBook.author}
                  </p>
                )}

                {/* CONDITION */}

                {selectedBook.condition && (
                  <div className="flex items-center gap-1 mt-4">
                    {/* <p
                      className="
                        text-xs
                        uppercase
                        tracking-wider
                        font-bold
                        text-gray-400
                        dark:text-gray-500
                        mb-2
                      "
                    >
                      Condition
                    </p> */}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Condition
                    </p>

                    <span
                      className="
                        book-condition-badge
                        !text-sm
                        !px-3
                        !py-1.5
                      "
                      data-condition={selectedBook.condition}>
                      {getBookConditionLabel(selectedBook.condition)}
                    </span>
                  </div>
                )}

                {/* META GRID */}

                <div
                  className="
                    grid
                    grid-cols-2
                    gap-3
                    mt-5
                  ">
                  {selectedBook.year && (
                    <div
                      className="
                        p-3
                        rounded-xl
                        bg-gray-50
                        dark:bg-gray-900/50
                        border
                        border-gray-200
                        dark:border-gray-700
                      ">
                      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                        {/* <FaCalendarAlt /> */}

                        <span className="text-xs">Publication year</span>
                      </div>

                      <p
                        className="
                          mt-1
                          font-semibold
                          text-gray-800
                          dark:text-white
                        ">
                        {selectedBook.year}
                      </p>
                    </div>
                  )}

                  {selectedBook.pages != null && (
                    <div
                      className="
                        p-3
                        rounded-xl
                        bg-gray-50
                        dark:bg-gray-900/50
                        border
                        border-gray-200
                        dark:border-gray-700
                      ">
                      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                        {/* <FaFileAlt /> */}

                        <span className="text-xs">Pages</span>
                      </div>

                      <p
                        className="
                          mt-1
                          font-semibold
                          text-gray-800
                          dark:text-white
                        ">
                        {Number(selectedBook.pages)}
                      </p>
                    </div>
                  )}

                  {selectedBook.language && (
                    <div
                      className="
                        col-span-2
                        p-3
                        rounded-xl
                        bg-gray-50
                        dark:bg-gray-900/50
                        border
                        border-gray-200
                        dark:border-gray-700
                      ">
                      <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                        {/* <FaGlobe /> */}

                        <span className="text-xs">Language</span>
                      </div>

                      <p
                        className="
                          mt-1
                          font-semibold
                          text-gray-800
                          dark:text-white
                        ">
                        {selectedBook.language}
                      </p>
                    </div>
                  )}
                </div>

                {/* DESCRIPTION */}

                {selectedBook.description && (
                  <div
                    className="
                      mt-5
                      p-4
                      rounded-2xl
                      bg-gray-50
                      dark:bg-gray-900/50
                      border
                      border-gray-200
                      dark:border-gray-700
                    ">
                    <div className="flex items-center gap-2 mb-2">
                      {/* <FaFileAlt className="text-[var(--primary-color)]" /> */}

                      <h3
                        className="
                          text-sm text-gray-400 dark:text-gray-500
                        ">
                        Book description
                      </h3>
                    </div>

                    <p
                      className="
                        text-sm
                        leading-6
                        text-gray-600
                        dark:text-gray-300
                        whitespace-pre-line
                        break-words
                      ">
                      {selectedBook.description}
                    </p>
                  </div>
                )}

                {/* CLOSE */}

                <button
                  type="button"
                  onClick={() => setSelectedBook(null)}
                  className="
                    mt-5
                    w-full
                    py-3
                    rounded-xl
                    border
                    border-gray-300
                    dark:border-gray-600
                    text-gray-700
                    dark:text-gray-200
                    font-semibold
                    hover:bg-gray-100
                    dark:hover:bg-gray-700
                    transition
                  ">
                  Back to collection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          TRADE MODAL
      ===================================================== */}

      {showTradeModal && (
        <TradeModal
          book={{
            ...collection,
            type: "collection",
          }}
          onClose={() => setShowTradeModal(false)}
        />
      )}
      <ImageLightbox
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(-1)}
        title={
          selectedBook?.title || collection.collectionName || "Book Collection"
        }
      />
    </>
  );
};

export default ProductCollectionModal;