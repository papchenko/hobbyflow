import { useEffect, useRef, useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";

const TradeModal = ({ book, onClose }) => {
  const { user } = useAuth();

  const modalRef = useRef(null);

  const [offerPrice, setOfferPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const isCollection = book?.type === "collection";
  const isComic = book?.type === "comic";
const isBoardGame = book?.type === "boardGame";

const productType = isCollection
  ? "collection"
  : isComic
  ? "comic"
  : isBoardGame
  ? "boardGame"
  : "book";

const productFields = {
  book: {
    id: "bookId",
    name: "bookName",
    image: "bookImage",
  },
  comic: {
    id: "comicId",
    name: "comicName",
    image: "comicImage",
  },
  collection: {
    id: "collectionId",
    name: "collectionName",
    image: "collectionImage",
  },
  boardGame: {
    id: "boardGameId",
    name: "boardGameName",
    image: "boardGameImage",
  },
}[productType];

  const productName = isCollection
    ? book?.collectionName || book?.name || "Book Collection"
    : book?.name || "Book";

  const productPrice = Number(book?.price || 0);

  const productImage = isCollection
    ? book?.image ||
      book?.images?.[0] ||
      book?.books?.[0]?.image ||
      book?.books?.[0]?.images?.[0] ||
      ""
    : book?.images?.[0] || book?.image || "";

  const productId =
  book?.id ||
  book?.boardGameId ||
  book?.comicId ||
  book?.collectionId ||
  book?.bookId;

  const minOfferPrice = Math.ceil(productPrice * 0.6);

  useEffect(() => {
    document.body.classList.add("no-scroll");

    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, []);

  useEffect(() => {
    const esc = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", esc);

    return () => {
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  const handleBackgroundClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const sendOffer = async () => {
    if (!user) {
      toast.error("Please login first.");
      return;
    }

    if (user.uid === book.sellerId) {
      toast.error("You cannot negotiate with yourself.");
      return;
    }if (
  isBoardGame &&
  (
    book.listingType === "rental_only" ||
    book.isCurrentlyRented === true ||
    Boolean(book.activeRentalOrderId)
  )
) {
  toast.error(
    "Trade offers are unavailable for this board game."
  );
  return;
}

if (
  !Number.isFinite(productPrice) ||
  productPrice <= 0
) {
  toast.error("Invalid sale price.");
  return;
}

    if (!offerPrice) {
      toast.error("Enter your offer.");
      return;
    }

    const value = Number(offerPrice);

    if (isNaN(value)) {
      toast.error("Invalid price.");
      return;
    }

    if (value < minOfferPrice) {
      toast.error(
        `Maximum discount is 40%. Minimum offer is ${minOfferPrice} ₴`
      );
      return;
    }

    if (value >= productPrice) {
      toast.error(
        `Offer must be less than ${productPrice} ₴`
      );
      return;
    }

    try {
      setLoading(true);

      // ---------------------------------------
      // CHECK EXISTING ACTIVE OFFER
      // ---------------------------------------

    const existingQuery = query(
  collection(db, "tradeOffers"),
  where(productFields.id, "==", productId),
  where("buyerId", "==", user.uid),
  where("status", "==", "pending")
);

      const existing = await getDocs(existingQuery);

      if (!existing.empty) {
        toast.info(
          isCollection
            ? "You already have an active offer for this collection."
            : "You already have an active offer for this book."
        );

        setLoading(false);
        return;
      }

      // ---------------------------------------
      // CREATE TRADE OFFER
      // ---------------------------------------

      const tradeData = {
        // Common fields
        type: productType,

        sellerId: book.sellerId,
        sellerName: book.sellerName || "",

        buyerId: user.uid,
        buyerName: user.displayName || "Unknown User",

        originalPrice: productPrice,
        offeredPrice: value,

        status: "pending",

        buyerRead: true,
        sellerRead: false,

        createdAt: serverTimestamp(),
      };

      // ---------------------------------------
      // BOOK
      // ---------------------------------------

     tradeData[productFields.id] = productId;
tradeData[productFields.name] = productName;
tradeData[productFields.image] = productImage;

if (isCollection) {
  tradeData.bookCount =
    book.bookCount ||
    book.books?.length ||
    0;
}

      await addDoc(
        collection(db, "tradeOffers"),
        tradeData
      );

      toast.success("Trade offer sent successfully.");

      setOfferPrice("");

      onClose();
    } catch (error) {
      console.error("Trade offer error:", error);

      toast.error("Failed to send offer.");
    } finally {
      setLoading(false);
    }
  };

  if (!book) return null;

  return (
    <div
      onClick={handleBackgroundClick}
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 p-4"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-[var(--secondary-color)] hover:dark:text-[var(--secondary-color)] transition"
        >
          <FaTimes size={18} />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
            Make an Offer
          </h2>

          <p className="mt-5 text-gray-500 dark:text-gray-300">
           {isCollection
  ? "Book Collection"
  : isComic
    ? "Comic"
    : isBoardGame
      ? "Board Game"
      : "Book"}
          </p>

          <p className="font-semibold text-lg text-gray-800 dark:text-white">
            {productName}
          </p>

          <div className="mt-6 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-700 dark:text-white">
              Original price
            </p>

            <h3 className="text-3xl font-bold text-green-600 mt-1">
              {productPrice} ₴
            </h3>
          </div>

          <div className="mt-6">
            <label className="block mb-2 font-medium text-gray-700 dark:text-gray-200">
              Your offer
            </label>

            <input
              type="number"
              min={minOfferPrice}
              max={productPrice - 1}
              step="1"
              value={offerPrice}
              onChange={(e) =>
                setOfferPrice(e.target.value)
              }
              placeholder="Enter your price..."
              className="w-full text-gray-700 dark:text-white rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 outline-none focus:ring-2 focus:ring-orange-500"
            />

            <p className="mt-1 text-sm text-[var(--secondary-color)] dark:text-[var(--secondary-color)]">
              You can negotiate up to 40% off the
              original price. Minimum offer:{" "}
              <b>{minOfferPrice} ₴</b>.
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-white">
              The seller will receive your offer and
              can accept or reject it.
            </p>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 py-3 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-700 dark:text-white"
            >
              Cancel
            </button>

            <button
              onClick={sendOffer}
              disabled={loading}
              className="flex-1 rounded-lg bg-[var(--secondary-color)] dark:bg-[var(--secondary-color)] hover:bg-[var(--secondary-color-hover)] hover:dark:bg-[var(--secondary-color-hover)] text-white py-3 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Offer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeModal;