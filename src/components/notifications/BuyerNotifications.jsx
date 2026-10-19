import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { toast } from "react-toastify";
import {
  FaHandshakeSimple,
  FaBox,
} from "react-icons/fa6";

import { FaArrowLeft } from "react-icons/fa";

import "./shopNotifications.scss";

const BuyerNotifications = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { addToCart, cart } = useCart();

  const [orders, setOrders] = useState([]);
  const [tradeOffers, setTradeOffers] = useState([]);


  const getOrderItemImage = (order) => {
    const item = order?.items?.[0];

    if (!item) return "";

    if (
      item.type === "collection" ||
      order.type === "collection"
    ) {
      const firstBook = item.books?.[0];

      return (
        item.image ||
        item.images?.[0] ||
        item.collection?.image ||
        item.collection?.images?.[0] ||
        firstBook?.image ||
        firstBook?.images?.[0] ||
        ""
      );
    }

    return (
      item.image ||
      item.images?.[0] ||
      ""
    );
  };


  useEffect(() => {
  if (!user?.uid) return;

  const q = query(
    collection(db, "orders"),
    where("buyerId", "==", user.uid)
  );

  const unsub = onSnapshot(q, (snap) => {
    const data = snap.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter(
        order =>
          order.buyerNotification?.status &&
          !order.buyerNotification?.read
      );

    setOrders(data);
  });

  return () => unsub();
}, [user]);

useEffect(() => {
  if (!user?.uid) return;

  const q = query(
    collection(db, "tradeOffers"),
    where("buyerId", "==", user.uid)
  );

  const unsub = onSnapshot(q, (snapshot) => {

    snapshot.docs.forEach((docSnap) => {
    });

    const data = snapshot.docs
  .map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
  .filter(
    (offer) =>
      offer.status !== "pending" &&
      offer.buyerRead === false
  );

    setTradeOffers(data);
  });

  return () => unsub();
}, [user]);

  const markOrderAsRead = async (order) => {
    if (order.buyerNotification?.read) return;

    try {
      await updateDoc(doc(db, "orders", order.id), {
        "buyerNotification.read": true,
      });
    } catch (error) {
      console.error(error);
    }
  };

const markTradeAsRead = async (offer) => {
  if (offer.buyerRead) return;

  try {
    await updateDoc(doc(db, "tradeOffers", offer.id), {
      buyerRead: true,
    });
  } catch (error) {
    console.error(error);
  }
};

const handleTradeCheckout = async (offer) => {
  try {
    if (offer.status !== "accepted") {
  toast.error("Only accepted trade offers can be added to cart.");
  return;
}
    const alreadyInCart = cart.some(
      (item) => item.tradeId === offer.id
    );

    if (alreadyInCart) {
      toast.info("This trade is already in your cart.");
      return;
    }

    /* =========================
       COLLECTION TRADE
    ========================= */

    if (
      offer.collectionId ||
      offer.collectionName ||
      offer.collection
    ) {
      const collection = offer.collection || {};

      const books = Array.isArray(
        offer.books
      )
        ? offer.books
        : Array.isArray(collection.books)
        ? collection.books
        : [];

      const collectionName =
        offer.collectionName ||
        collection.collectionName ||
        collection.name ||
        collection.title ||
        "Book Collection";

      const collectionImage =
        offer.collectionImage ||
        offer.image ||
        collection.image ||
        collection.images?.[0] ||
        collection.imageUrl ||
        collection.coverUrl ||
        books[0]?.image ||
        books[0]?.images?.[0] ||
        books[0]?.imageUrl ||
        books[0]?.coverUrl ||
        "";

      const cleanBooks = books.map((book) => ({
        id: book?.id ?? null,
        name: book?.name ?? "",
        title: book?.title ?? "",
        author: book?.author ?? "",
        image:
          book?.image ||
          book?.images?.[0] ||
          book?.imageUrl ||
          book?.coverUrl ||
          "",
        images: Array.isArray(book?.images)
          ? book.images.filter(Boolean)
          : [],
        price: Number(book?.price ?? 0),
      }));

      addToCart({
        id:
          offer.collectionId ||
          collection.id ||
          offer.id,

        collectionId:
          offer.collectionId ||
          collection.id ||
          null,

        type: "collection",

        name: collectionName,

        collectionName,

        image: collectionImage,

        images: collectionImage
          ? [collectionImage]
          : [],

        books: cleanBooks,

        bookCount:
          Number(
            offer.bookCount ??
              collection.bookCount ??
              cleanBooks.length
          ),

        // price: Number(
        //   offer.originalPrice ?? 0
        // ),

        // finalPrice: Number(
        //   offer.offeredPrice ?? 0
        // ),
        price: Number(
          offer.originalPrice ?? 0
        ),

        finalPrice: Number(
          offer.offeredPrice ?? 0
        ),

        purchaseType: "full",

        sellerId:
          offer.sellerId ??
          collection.sellerId ??
          null,

        sellerName:
          offer.sellerName ??
          collection.sellerName ??
          "",

        tradeId: offer.id,

        isTrade: true,

        quantity: 1,
      });

      toast.success(
        "Book collection added to cart."
      );

      return;
    }

/* =========================
   BOOK / COMIC / BOARD GAME TRADE
========================= */

const type =
  offer.type === "boardGame" || offer.boardGameId
    ? "boardGame"
    : offer.type === "comic" || offer.comicId
    ? "comic"
    : "book";

const productId =
  type === "boardGame"
    ? offer.boardGameId
    : type === "comic"
    ? offer.comicId
    : offer.bookId;

const productName =
  type === "boardGame"
    ? offer.boardGameName
    : type === "comic"
    ? offer.comicName
    : offer.bookName;

const productImage =
  type === "boardGame"
    ? offer.boardGameImage
    : type === "comic"
    ? offer.comicImage
    : offer.bookImage;

if (!productId) {
  toast.error("Trade product ID is missing.");
  return;
}

await addToCart({
  id: productId,

  ...(type === "boardGame"
    ? { boardGameId: productId }
    : type === "comic"
    ? { comicId: productId }
    : { bookId: productId }),

  type,

  name: productName || "Product",

  image: productImage || "",
  images: productImage ? [productImage] : [],

  price: Number(offer.originalPrice ?? 0),
  finalPrice: Number(offer.offeredPrice ?? 0),

  purchaseType: "full",

  sellerId: offer.sellerId,
  sellerName: offer.sellerName || "",

  tradeId: offer.id,
  isTrade: true,

  quantity: 1,
});

toast.success(
  type === "boardGame"
    ? "Board game added to cart."
    : type === "comic"
    ? "Comic added to cart."
    : "Book added to cart."
);
  } catch (error) {
    console.error(
      "TRADE CHECKOUT ERROR:",
      error
    );

    toast.error(
      "Failed to add item to cart."
    );
  }
};

          if (!isOpen) return null;

          const hasNotifications =
  orders.length > 0 || tradeOffers.length > 0;

return createPortal(
  <>
    <div
      className="shop-notifications-backdrop"
      onClick={onClose}
    />

    <aside
      className="shop-notifications-drawer"
      onClick={(e) => e.stopPropagation()}
    >

      <header className="shop-notifications-header">
        <div className="shop-notifications-header-content">
          {/* <div className="shop-notifications-header-icon">
            <FaBox />
          </div> */}

          <div>
            {/* <h4>Notifications</h4> */}
            <span className="text-xl">
              {orders.length + tradeOffers.length} new
            </span>
          </div>
        </div>

        <button
          type="button"
          className="shop-notifications-close"
          onClick={onClose}
          aria-label="Close notifications"
        >
          <FaArrowLeft />
        </button>
      </header>

      <div className="shop-notifications-body">

        {!hasNotifications && (
          <div className="shop-notifications-empty">
            <div className="shop-notifications-empty-icon">
              <FaBox />
            </div>

            <h4>You're all caught up</h4>

            <p>
              You don't have any new orders or trade notifications.
            </p>
          </div>
        )}

        {orders.length > 0 && (
          <section className="shop-notifications-section">

            {/* <div className="shop-notifications-section-title">
              <FaBox />
              <span>Orders</span>
            </div> */}

            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => markOrderAsRead(order)}
                className="shop-notification-card"
              >
                
<div
  className={`shop-notification-card-icon ${
    getOrderItemImage(order)
      ? "shop-notification-card-icon--image"
      : ""
  }`}
>
  {getOrderItemImage(order) ? (
    <img
      src={getOrderItemImage(order)}
      alt={order.items?.[0]?.name || "Product cover"}
      className="shop-notification-card-cover"
    />
  ) : (
    <FaBox />
  )}
</div>


                <div className="shop-notification-card-content">

                  <div className="shop-notification-card-top">
                    <strong>
                      {order.items?.[0]?.name}
                    </strong>

                    {/* <span className="shop-notification-badge">
                      ORDER
                    </span> */}
                  </div>

                  <span className="shop-notification-message">
                    {order.buyerNotification?.status === "accepted"
                      ? "Accepted. Now pay the money. In the Purchase History section, you will find the seller's card number and order number. When paying, be sure to include the order number in the payment to the seller. After payment, the seller will send you the book."
                      : order.buyerNotification?.status === "rejected"
                      ? "Rejected"
                      : order.buyerNotification?.status}
                  </span>

                </div>
              </div>
            ))}

          </section>
        )}

        {tradeOffers.length > 0 && (
          <section className="shop-notifications-section">

            <div className="shop-notifications-section-title trade">
              <FaHandshakeSimple />
              <span>Trade Offers</span>
            </div>

            {tradeOffers.map((offer) => (
              <div
                key={offer.id}
                onClick={() => markTradeAsRead(offer)}
                className="shop-notification-card"
              >

                <div className="shop-notification-card-icon trade">
                  <FaHandshakeSimple />
                </div>

                <div className="shop-notification-card-content">

                  <div className="shop-notification-card-top">
                    <strong>
                      {offer.bookName}
                    </strong>

                    <span className="shop-notification-badge trade">
                      TRADE
                    </span>
                  </div>

                  <div className="shop-notification-details">

                    <div>
                      <span>Original price</span>
                      <strong className="price-original">
                        {offer.originalPrice} ₴
                      </strong>
                    </div>

                    <div>
                      <span>Your offer</span>
                      <strong className="price-offer">
                        {offer.offeredPrice} ₴
                      </strong>
                    </div>

                    <div>
                      <span>Status</span>
                      <strong className="status">
                        {offer.status}
                      </strong>
                    </div>

                  </div>

                  {offer.status === "accepted" && (
                    <button
                      className="shop-notification-checkout"
                      onClick={async (e) => {
                        e.stopPropagation();

                        await markTradeAsRead(offer);
                        await handleTradeCheckout(offer);
                      }}
                    >
                      Checkout
                    </button>
                  )}

                </div>

              </div>
            ))}

          </section>
        )}

      </div>
    </aside>
  </>,
  document.body
);
};

export default BuyerNotifications;