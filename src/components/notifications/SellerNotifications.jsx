import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  FaBox,
  FaHandshakeSimple,
} from "react-icons/fa6";

import { FaArrowLeft } from "react-icons/fa";

import "./shopNotifications.scss";


const getListingType = (product) => {
  if (product?.listingType) {
    return product.listingType;
  }

  const isLendingAvailable =
    product?.isLendingAvailable ??
    (Number(product?.priceLending) > 0);

  return isLendingAvailable
    ? "sale_and_rental"
    : "sale";
};


const SellerNotifications = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [tradeOffers, setTradeOffers] = useState([]);


const getOrderItemImage = (order) => {
  const item = order?.items?.[0];

  if (!item) return "";

  // Колекція книг
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

  // Звичайна книга або комікс
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
      where("sellerIds", "array-contains", user.uid),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach((doc) => {
});
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setOrders(data);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "tradeOffers"),
      where("sellerId", "==", user.uid),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach((doc) => {
});
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTradeOffers(data);
    });

    return () => unsub();
  }, [user]);



const handleAcceptOrder = async (order) => {
  if (!user?.uid) {
    toast.error("You must be logged in.");
    return;
  }

  try {
    const orderRef = doc(db, "orders", order.id);
    const sellerRef = doc(db, "users", user.uid);

    await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists()) {
        throw new Error("Order not found.");
      }

      const currentOrder = orderSnap.data();

      if (currentOrder.status !== "pending") {
        throw new Error("This order has already been processed.");
      }

      const isSeller =
        currentOrder.sellerId === user.uid ||
        (
          Array.isArray(currentOrder.sellerIds) &&
          currentOrder.sellerIds.includes(user.uid)
        );

      if (!isSeller) {
        throw new Error("You are not the seller of this order.");
      }

   const items = [
  ...(Array.isArray(currentOrder.items)
    ? currentOrder.items
    : []),

  ...(Array.isArray(currentOrder.bookItems)
    ? currentOrder.bookItems
    : []),

  ...(Array.isArray(currentOrder.comicItems)
    ? currentOrder.comicItems
    : []),

  ...(Array.isArray(currentOrder.boardGameItems)
    ? currentOrder.boardGameItems
    : []),
];

      if (items.length === 0) {
        throw new Error("This order contains no products.");
      }

      const isTrade =
        currentOrder.isTrade === true ||
        Boolean(currentOrder.tradeId) ||
        currentOrder.tradeCompleted === true;

      const rentalItems = isTrade
        ? []
        : items.filter(
            (item) =>
              item.purchaseType === "rental" &&
              item.isTrade !== true &&
              !item.tradeId
          );

const productMap = new Map();

rentalItems.forEach((item) => {
  const type = item.type || currentOrder.type;

  let collectionName;
  let productId;

  if (type === "comic") {
    collectionName = "comics";
    productId = item.comicId || item.id;
  } else if (type === "boardGame") {
    collectionName = "boardGames";
    productId = item.boardGameId || item.id;
  } else if (type === "book") {
    collectionName = "books";
    productId = item.bookId || item.id;
  } else {
    throw new Error(
      "Unsupported rental product type."
    );
  }

  if (!productId) {
    throw new Error(
      "Could not identify a rented product."
    );
  }

  const key = `${collectionName}:${productId}`;

  if (!productMap.has(key)) {
    productMap.set(key, {
      ref: doc(db, collectionName, productId),
      productId,
    });
  }
});

      const products = [...productMap.values()];

      // All transaction reads happen before writes.
      const productSnaps = await Promise.all(
        products.map(({ ref }) => transaction.get(ref))
      );

      // Also read the seller before any transaction writes.
      const sellerSnap = await transaction.get(sellerRef);

      if (!sellerSnap.exists()) {
        throw new Error("Seller profile not found.");
      }

      productSnaps.forEach((productSnap, index) => {
        if (!productSnap.exists()) {
  throw new Error(
    "A product in this order was not found."
  );
}

        const productData = productSnap.data();
        const listingType = getListingType(productData);

        if (
          productData.sellerId &&
          productData.sellerId !== user.uid
        ) {
          throw new Error(
            "A rented product belongs to another seller."
          );
        }

        if (
          listingType === "sale" ||
          Number(productData.priceLending) <= 0
        ) {
          throw new Error(
            "A product is no longer available for rental."
          );
        }

        if (
          productData.isCurrentlyRented === true ||
          productData.activeRentalOrderId
        ) {
          throw new Error(
            "One of the products is already rented."
          );
        }
      });

      // Mark rented products as unavailable.
      products.forEach(({ ref }) => {
        transaction.update(ref, {
          isCurrentlyRented: true,
          activeRentalOrderId: order.id,
        });
      });

      // Preserve the existing seller statistics logic.
      const totalAmount = items.reduce((sum, item) => {
        const price =
          item.isTrade && item.finalPrice != null
            ? Number(item.finalPrice)
            : item.purchaseType === "rental"
              ? Number(item.priceLending || 0)
              : Number(item.price || 0);

        return sum + (Number.isFinite(price) ? price : 0);
      }, 0);

      transaction.update(sellerRef, {
        completedOrders: increment(1),
        totalSalesAmount: increment(totalAmount),
        salesRating: increment(1),
        ratingCount: increment(1),
        ratingAverage: increment(1),

        "sellerStats.completedOrders": increment(1),
        "sellerStats.totalSalesAmount": increment(totalAmount),
        "sellerStats.salesRating": increment(1),
        "sellerStats.ratingCount": increment(1),
        "sellerStats.ratingAverage": increment(1),

        "sellerStats.lastSale": new Date(),
        "sellerStats.lastSaleAmount": totalAmount,
      });

      transaction.update(orderRef, {
        status: "accepted",
        buyerNotification: {
          status: "accepted",
          read: false,
          createdAt: new Date(),
        },
      });
    });

    toast.success("Order accepted.");
  } catch (error) {
    console.error("Error accepting order:", error);

    toast.error(
      error.message || "Failed to accept order."
    );
  }
};



  const handleRejectOrder = async (order) => {
    try {

      await updateDoc(doc(db, "orders", order.id), {

        status: "rejected",

        buyerNotification: {
          status: "rejected",
          read: false,
          createdAt: new Date(),
        },

      });

      toast.info("Order rejected.");

    } catch (error) {
      console.error(error);
      toast.error("Failed to reject order.");
    }
  };
   const handleAcceptTrade = async (offer) => {
    try {

      await updateDoc(doc(db, "tradeOffers", offer.id), {

        status: "accepted",

        sellerRead: true,

        buyerRead: false,

        sellerResponseAt: new Date(),

      });

      toast.success("Trade offer accepted.");

    } catch (error) {

      console.error(error);

      toast.error("Failed to accept trade offer.");

    }
  };

  const handleRejectTrade = async (offer) => {

    try {

      await updateDoc(doc(db, "tradeOffers", offer.id), {

        status: "rejected",

        sellerRead: true,

        buyerRead: false,

        sellerResponseAt: new Date(),

      });

      toast.info("Trade offer rejected.");

    } catch (error) {

      console.error(error);

      toast.error("Failed to reject trade offer.");

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
            {/* <h4>Seller Notifications</h4> */}
            <span>
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

            <h4>No pending notifications</h4>

            <p>
              You don't have any new orders or trade offers.
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

                  <div className="shop-notification-details">

                    <div>
                      <span>Type</span>
                      <strong>
                        {order.items?.[0]?.purchaseType === "rental"
                          ? "Lending"
                          : "Buying"}
                      </strong>
                    </div>

                    <div>
                      <span>Price</span>
                      <strong className="price-offer">
                        {order.items?.[0]?.purchaseType === "rental"
                          ? order.items?.[0]?.priceLending
                          : order.items?.[0]?.price}{" "}
                        ₴
                      </strong>
                    </div>

                  </div>

                  <div className="shop-notification-actions">

                    <button
                      onClick={() => handleAcceptOrder(order)}
                      className="accept"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => handleRejectOrder(order)}
                      className="reject"
                    >
                      Reject
                    </button>

                  </div>

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
                className="shop-notification-card"
              >

                <div className="shop-notification-card-icon trade">
                  <FaHandshakeSimple />
                </div>

                <div className="shop-notification-card-content">

                  <div className="shop-notification-card-top">
<strong>
  {offer.boardGameName ||
    offer.comicName ||
    offer.collectionName ||
    offer.bookName ||
    "Product"}
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
                      <span>Buyer offers</span>
                      <strong className="price-offer">
                        {offer.offeredPrice} ₴
                      </strong>
                    </div>

                  </div>

                  <div className="shop-notification-actions">

                    <button
                      onClick={() => handleAcceptTrade(offer)}
                      className="accept"
                    >
                      Accept
                    </button>

                    <button
                      onClick={() => handleRejectTrade(offer)}
                      className="reject"
                    >
                      Reject
                    </button>

                  </div>

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

export default SellerNotifications;