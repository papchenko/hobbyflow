import { useEffect, useState } from "react";
import { completeRentalOrder } from "../utils/completeRentalOrder";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import {
  FaArrowLeft,
  FaBook,
  FaBoxOpen,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaHandshake,
  FaLanguage,
  FaLayerGroup,
  FaUser,
  FaUsers,
  FaBuilding,
  FaPalette,
  FaHashtag,
  FaFileAlt,
  FaTag,
  FaExchangeAlt,
} from "react-icons/fa";
import { FaDice } from "react-icons/fa6";
import { db } from "../../firebase";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { getBookConditionLabel } from "../../constants/bookMeta";

import "./OrderDetailsPage.scss";
const formatOrderDate = (order) => {
  const value =
    order?.createdAt ??
    order?.created_at ??
    order?.orderDate ??
    order?.date ??
    null;

  if (!value) return "—";

  let date;

  if (typeof value.toDate === "function") {
    date = value.toDate();
  } else if (typeof value.seconds === "number") {
    date = new Date(
      value.seconds * 1000 +
      (value.nanoseconds || 0) / 1000000
    );
  } else if (typeof value === "number") {
    date = new Date(value < 1e12 ? value * 1000 : value);
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
const getPurchaseLabel = (item) => {
  if (item?.purchaseType === "rental") {
    return "Lending";
  }

  return "Buying";
};

const isTradeItem = (item) => {
  return item?.isTrade === true || Boolean(item?.tradeId);
};

const getPaidPrice = (item) => {
  if (item?.finalPrice !== undefined && item?.finalPrice !== null) {
    return Number(item.finalPrice) || 0;
  }

  if (item?.purchaseType === "rental") {
    return Number(item?.priceLending) || 0;
  }

  return Number(item?.price) || 0;
};

const formatPrice = (price) => {
  const value = Number(price);

  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toFixed(2);
};


const getOrderItems = (order) => {
  if (!order) return [];

  const items = [
    ...(Array.isArray(order.items) ? order.items : []),
    ...(Array.isArray(order.bookItems) ? order.bookItems : []),
    ...(Array.isArray(order.comicItems) ? order.comicItems : []),
    ...(Array.isArray(order.boardGameItems) ? order.boardGameItems : []),
  ];

  const seen = new Set();

  return items.filter((item) => {
    if (!item) return false;

    const productId =
      item.id ||
      item.bookId ||
      item.comicId ||
      item.boardGameId;

    if (!productId) return true;

    const key = `${item.type || order.type || "book"}:${productId}`;

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
};


const getCondition = (condition) => {
  if (!condition) {
    return "Not specified";
  }

  return getBookConditionLabel(condition) || condition;
};

const InfoPill = ({ icon, label, value }) => {
  if (!value) {
    return null;
  }

  return (
    <div className="order-info-pill">
      <span className="order-info-pill__icon">{icon}</span>

      <div className="order-info-pill__content">
        <div className="order-info-pill__label">{label}</div>

        <div className="order-info-pill__value">{value}</div>
      </div>
    </div>
  );
};

const PurchaseBadge = ({ item }) => {
  const trade = isTradeItem(item);
  const purchaseLabel = getPurchaseLabel(item);

  return (
    <div className="order-badges">
      <span className="order-badge order-badge--accent">
        <FaTag />
        {purchaseLabel}
      </span>

      {trade && (
        <span className="order-badge order-badge--trade">
          <FaHandshake />
          Trade
        </span>
      )}
    </div>
  );
};

const TradePriceBox = ({ item }) => {
  if (!isTradeItem(item)) {
    return null;
  }

  const originalPrice = Number(item.price) || 0;
  const acceptedPrice = getPaidPrice(item);

  return (
    <div className="order-trade-box">
      <div className="order-trade-box__header">
        <div className="order-trade-box__icon">
          <FaHandshake />
        </div>

        <div>
          <p className="order-trade-box__eyebrow">Trade offer</p>

          <p className="order-trade-box__title">Accepted offer</p>
        </div>
      </div>

      <div className="order-trade-box__prices">
        <div className="order-trade-price">
          <span>Original price</span>

          <strong className="order-trade-price--original">
            ${formatPrice(originalPrice)}
          </strong>
        </div>

        <div className="order-trade-price">
          <span>Accepted price</span>

          <strong className="order-trade-price--accepted">
            ${formatPrice(acceptedPrice)}
          </strong>
        </div>
      </div>
    </div>
  );
};

const PriceBox = ({ item }) => {
  const paidPrice = getPaidPrice(item);
  const trade = isTradeItem(item);

  if (trade) {
    return null;
  }

  return (
    <div className="order-price-box">
      <div>
        <p className="order-price-box__label">
          {item?.purchaseType === "rental" ? "Lending price" : "Purchase price"}
        </p>

        <p className="order-price-box__value">${formatPrice(paidPrice)}</p>
      </div>

      <div className="order-price-box__icon">
        <FaTag />
      </div>
    </div>
  );
};

const BookCard = ({ book, index, compact = false }) => {
  const image = book?.image || book?.images?.[0] || "";

  return (
    <div
      className={`order-book-small ${
        compact ? "order-book-small--compact" : ""
      }`}>
      <div className="order-book-small__cover-wrapper">
        {image ? (
          <img
            src={image}
            alt={book?.name || book?.title || "Book"}
            className="order-book-small__cover"
          />
        ) : (
          <div className="order-book-small__cover order-book-small__cover--placeholder">
            <FaBook />
          </div>
        )}

        {index !== undefined && (
          <div className="order-book-small__number">{index}</div>
        )}
      </div>

      <div className="order-book-small__content">
        <div className="order-book-small__badges">
          <span className="order-badge order-badge--neutral">
            <FaBook />
            Book
          </span>

          {book?.isTrade && (
            <span className="order-badge order-badge--trade">
              <FaHandshake />
              Trade
            </span>
          )}
        </div>

        <h4>{book?.name || book?.title || "Untitled book"}</h4>

        {book?.author && (
          <div className="order-book-small__author">
            <FaUser />
            <span>{book.author}</span>
          </div>
        )}

        <div className="order-info-grid order-info-grid--small">
          <InfoPill
            icon={<FaFileAlt />}
            label="Pages"
            value={book?.pages ? `${book.pages}` : null}
          />

          <InfoPill
            icon={<FaLanguage />}
            label="Language"
            value={book?.language}
          />

          <InfoPill
            icon={<FaCheckCircle />}
            label="Condition"
            value={getCondition(book?.condition)}
          />

          <InfoPill
            icon={<FaCalendarAlt />}
            label="Year"
            value={book?.year ? `${book.year}` : null}
          />
        </div>

        {book?.description && (
          <div className="order-description">
            <div className="order-description__title">
              <FaFileAlt />
              Description
            </div>

            <p>{book.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const BookOrderCard = ({ item, index }) => {
  return (
    <div className="order-product-card">
      <div className="order-product-card__body">
        <div className="order-product-card__main">
          <div className="order-product-card__cover-wrapper">
            {item?.image ? (
              <img
                src={item.image}
                alt={item?.name || "Book"}
                className="order-product-card__cover"
              />
            ) : (
              <div className="order-product-card__cover order-product-card__cover--placeholder">
                <FaBook />
              </div>
            )}

            <div className="order-product-card__number">{index}</div>
          </div>

          <div className="order-product-card__content">
            <PurchaseBadge item={item} />

            <h3>{item?.name || "Untitled book"}</h3>

            {item?.author && (
              <div className="order-product-card__author">
                <FaUser />
                <span>{item.author}</span>
              </div>
            )}

            <div className="order-info-grid">
              <InfoPill
                icon={<FaFileAlt />}
                label="Pages"
                value={item?.pages ? `${item.pages}` : null}
              />

              <InfoPill
                icon={<FaLanguage />}
                label="Language"
                value={item?.language}
              />

              <InfoPill
                icon={<FaCheckCircle />}
                label="Condition"
                value={getCondition(item?.condition)}
              />

              <InfoPill
                icon={<FaCalendarAlt />}
                label="Year"
                value={item?.year ? `${item.year}` : null}
              />

              <InfoPill
                icon={<FaTag />}
                label="Type"
                value={getPurchaseLabel(item)}
              />
            </div>
          </div>
        </div>

        <div className="order-price-grid">
          <PriceBox item={item} />

          <TradePriceBox item={item} />
        </div>

        {item?.description && (
          <div className="order-description">
            <div className="order-description__title">
              <FaFileAlt />
              Description
            </div>

            <p>{item.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CollectionOrderCard = ({ item }) => {
  const books = item?.books || [];

  const image =
    item?.image ||
    item?.images?.[0] ||
    books?.[0]?.image ||
    books?.[0]?.images?.[0] ||
    "";

  const paidPrice = getPaidPrice(item);
  const trade = isTradeItem(item);

  return (
    <div className="order-collection">
      <div className="order-collection__card">
        <div className="order-collection__main">
          <div className="order-collection__cover-wrapper">
            {image ? (
              <img
                src={image}
                alt={item?.collectionName || item?.name || "Collection"}
                className="order-collection__cover"
              />
            ) : (
              <div className="order-collection__cover order-collection__cover--placeholder">
                <FaLayerGroup />
              </div>
            )}

            <div className="order-collection__icon">
              <FaLayerGroup />
            </div>
          </div>

          <div className="order-collection__content">
            <div className="order-badges">
              <span className="order-badge order-badge--accent">
                <FaLayerGroup />
                Book Collection
              </span>

              {trade && (
                <span className="order-badge order-badge--trade">
                  <FaHandshake />
                  Trade
                </span>
              )}
            </div>

            <h3>
              {item?.collectionName || item?.name || "Untitled collection"}
            </h3>

            <div className="order-info-grid">
              <InfoPill
                icon={<FaBook />}
                label="Books"
                value={`${books.length || item?.bookCount || 0}`}
              />

              <InfoPill icon={<FaTag />} label="Purchase type" value="Buying" />

              <InfoPill
                icon={<FaCheckCircle />}
                label="Status"
                value={trade ? "Trade accepted" : "Purchased"}
              />
            </div>

            <div className="order-collection__price">
              <div>
                <span>
                  {trade ? "Accepted trade price" : "Collection price"}
                </span>

                <strong>${formatPrice(paidPrice)}</strong>
              </div>

              <div className="order-collection__price-icon">
                {trade ? <FaHandshake /> : <FaTag />}
              </div>
            </div>
          </div>
        </div>

        {trade && <TradePriceBox item={item} />}
      </div>

      {books.length > 0 && (
        <div className="order-collection__books">
          <div className="order-subsection-header">
            <div className="order-subsection-header__icon">
              <FaBook />
            </div>

            <div>
              <h4>Books in collection</h4>

              <p>
                {books.length} {books.length === 1 ? "book" : "books"}
              </p>
            </div>
          </div>

          <div className="order-collection__book-list">
            {books.map((book, index) => (
              <BookCard
                key={book?.id || `${book?.title}-${index}`}
                book={book}
                index={index + 1}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ComicOrderCard = ({ item, index }) => {
  const image = item?.image || item?.images?.[0] || "";

  const trade = isTradeItem(item);
  const paidPrice = getPaidPrice(item);

  return (
    <div className="order-product-card order-product-card--comic">
      <div className="order-product-card__body">
        <div className="order-product-card__main">
          <div className="order-product-card__cover-wrapper">
            {image ? (
              <img
                src={image}
                alt={item?.name || "Comic"}
                className="order-product-card__cover order-product-card__cover--comic"
              />
            ) : (
              <div className="order-product-card__cover order-product-card__cover--placeholder">
                <FaBook />
              </div>
            )}

            <div className="order-product-card__number">{index}</div>
          </div>

          <div className="order-product-card__content">
            <div className="order-badges">
              <span className="order-badge order-badge--comic">
                <FaBook />
                Comic
              </span>

              {trade && (
                <span className="order-badge order-badge--trade">
                  <FaHandshake />
                  Trade
                </span>
              )}

              {!trade && (
                <span className="order-badge order-badge--accent">
                  <FaTag />
                  {getPurchaseLabel(item)}
                </span>
              )}
            </div>

            <h3>{item?.name || "Untitled comic"}</h3>

            <div className="order-product-card__authors">
              {item?.author && (
                <span>
                  <FaUser />
                  {item.author}
                </span>
              )}

              {item?.artist && (
                <span>
                  <FaPalette />
                  {item.artist}
                </span>
              )}
            </div>

            <div className="order-info-grid">
              <InfoPill
                icon={<FaBuilding />}
                label="Publisher"
                value={item?.publisher}
              />

              <InfoPill
                icon={<FaHashtag />}
                label="Issue"
                value={item?.issue}
              />

              <InfoPill
                icon={<FaLayerGroup />}
                label="Volume"
                value={item?.volume}
              />

              <InfoPill
                icon={<FaCalendarAlt />}
                label="Year"
                value={item?.year ? `${item.year}` : null}
              />

              <InfoPill icon={<FaTag />} label="Genre" value={item?.genre} />

              <InfoPill
                icon={<FaFileAlt />}
                label="Pages"
                value={item?.pages ? `${item.pages}` : null}
              />

              <InfoPill
                icon={<FaLanguage />}
                label="Language"
                value={item?.language}
              />

              <InfoPill
                icon={<FaCheckCircle />}
                label="Condition"
                value={getCondition(item?.condition)}
              />
            </div>
          </div>
        </div>

        <div className="order-price-grid">
          {!trade && (
            <div className="order-price-box">
              <div>
                <p className="order-price-box__label">
                  {item?.purchaseType === "rental"
                    ? "Lending price"
                    : "Purchase price"}
                </p>

                <p className="order-price-box__value">
                  ${formatPrice(paidPrice)}
                </p>
              </div>

              <div className="order-price-box__icon">
                <FaTag />
              </div>
            </div>
          )}

          {trade && <TradePriceBox item={item} />}

          {trade && item?.purchaseType && (
            <div className="order-price-box">
              <div>
                <p className="order-price-box__label">Purchase type</p>

                <p className="order-price-box__text">
                  {getPurchaseLabel(item)}
                </p>
              </div>

              <div className="order-price-box__icon">
                <FaExchangeAlt />
              </div>
            </div>
          )}
        </div>

        {item?.description && (
          <div className="order-description">
            <div className="order-description__title">
              <FaFileAlt />
              Description
            </div>

            <p>{item.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const BoardGameOrderCard = ({ item, index }) => {
  const image = item?.image || item?.images?.[0] || "";

  return (
    <div className="order-product-card">
      <div className="order-product-card__body">

        <div className="order-product-card__main">
          <div className="order-product-card__cover-wrapper">
            {image ? (
              <img
                src={image}
                alt={item?.name || "Board Game"}
                className="order-product-card__cover"
              />
            ) : (
              <div className="order-product-card__cover order-product-card__cover--placeholder">
                <FaDice />
              </div>
            )}

            <div className="order-product-card__number">
              {index}
            </div>
          </div>

          <div className="order-product-card__content">
            <div className="order-badges">
              <span className="order-badge order-badge--neutral">
                <FaDice />
                Board Game
              </span>

              <span className="order-badge order-badge--accent">
                <FaTag />
                {getPurchaseLabel(item)}
              </span>
            </div>

            <h3>{item?.name || "Untitled board game"}</h3>

            <div className="order-info-grid">
              <InfoPill
                icon={<FaUser />}
                label="Game Designer"
                value={item?.author}
              />
              <InfoPill
                icon={<FaBuilding />}
                label="Publisher"
                value={item?.publisher}
              />

              <InfoPill
                icon={<FaTag />}
                label="Category"
                value={item?.category}
              />

              <InfoPill
                icon={<FaUsers />}
                label="Players"
                value={
                  item?.minPlayers != null &&
                  item?.maxPlayers != null
                    ? `${item.minPlayers}–${item.maxPlayers}`
                    : null
                }
              />

              <InfoPill
                icon={<FaClock />}
                label="Play time"
                value={
                  item?.playTime != null
                    ? `${item.playTime} min`
                    : null
                }
              />

              <InfoPill
                icon={<FaUser />}
                label="Minimum age"
                value={
                  item?.minAge != null
                    ? `${item.minAge}+`
                    : null
                }
              />

              <InfoPill
                icon={<FaLanguage />}
                label="Language"
                value={item?.language}
              />

              <InfoPill
                icon={<FaCheckCircle />}
                label="Condition"
                value={item?.condition}
              />

              <InfoPill
                icon={<FaBoxOpen />}
                label="Completeness"
                value={item?.completeness}
              />

              <InfoPill
                icon={<FaCalendarAlt />}
                label="Year"
                value={item?.year ? `${item.year}` : null}
              />
            </div>
          </div>
        </div>

        <div className="order-price-grid">
          <PriceBox item={item} />
          <TradePriceBox item={item} />
        </div>

        {item?.description && (
          <div className="order-description">
            <div className="order-description__title">
              <FaFileAlt />
              Description
            </div>

            <p>{item.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const OrderDetailsPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingReturn, setCompletingReturn] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const orderRef = doc(db, "orders", orderId);

        const orderSnap = await getDoc(orderRef);

        if (orderSnap.exists()) {
          setOrder({
            id: orderSnap.id,
            ...orderSnap.data(),
          });
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleConfirmReturn = async () => {
    if (!order || !user || completingReturn) {
      return;
    }

const orderItems = getOrderItems(order);

const hasRentalItems = orderItems.some(
  (item) =>
    item.purchaseType === "rental" &&
    item.isTrade !== true &&
    !item.tradeId,
);

    if (!hasRentalItems) {
      toast.info("There are no rented items in this order.");
      return;
    }

    const isSeller =
      order.sellerId === user.uid ||
      (Array.isArray(order.sellerIds) && order.sellerIds.includes(user.uid)) ||
      orderItems.some((item) => item.sellerId === user.uid);

    if (!isSeller) {
      toast.info("Only the seller of this order can confirm the return");
      return;
    }

    if (order.status !== "accepted") {
      toast.info("The order must be accepted before the return is confirmed.");
      return;
    }

    if (order.rentalCounted === true) {
      toast.info("This rental has already been credited.");
      return;
    }

    try {
      setCompletingReturn(true);

      const result = await completeRentalOrder(order.id, user.uid);

if (result.alreadyCounted) {
  toast.info("This rental has already been completed.");
  setShowReturnModal(false);
  return;
}

      setOrder((previous) => ({
        ...previous,
        status: "completed",
        rentalCounted: true,
      }));

      setShowReturnModal(false);

      toast.success("Return confirmed. Rental credited.");
    } catch (error) {
     console.error("Error confirming rental return:", error);
toast.error(error.message || "Unable to confirm the return.");
    } finally {
      setCompletingReturn(false);
    }
  };

  if (loading) {
    return (
      <section className="order-details">
        <div className="order-details__container">
          <div className="order-loading">
            <div className="order-loading__loader" />

            <span>Loading order...</span>
          </div>
        </div>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="order-details">
        <div className="order-details__container">
          <div className="order-empty">
            <div className="order-empty__icon">
              <FaBoxOpen />
            </div>

            <h2>Order not found</h2>

            <p>We couldn't find this order.</p>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="order-button">
              <FaArrowLeft />
              Go back
            </button>
          </div>
        </div>
      </section>
    );
  }

  const items = getOrderItems(order);

const isCollection = order.type === "collection";

const isComic = order.type === "comic";

const isBoardGame =
  order.type === "boardGame" ||
  (
    order.type !== "collection" &&
    order.type !== "comic" &&
    items.length > 0 &&
    items.every((item) => item.type === "boardGame")
  );

const sectionTitle = isCollection
  ? "Collection"
  : isComic
    ? "Comic"
    : isBoardGame
      ? "Board Games"
      : "Books";

  return (
    <section className="order-details">
      <div className="order-details__container">
        {/* HEADER */}

        <div className="order-details__header">
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="order-back">
              <FaArrowLeft />
              Back
            </button>

            <span className="order-details__eyebrow">ORDER DETAILS</span>

            {/* <h1>
              Order details
            </h1> */}

            <p>Order #{order.orderNumber || order.id}</p>
          </div>

          <div className="order-status">
            <FaClock />

            <div>
              <span>Status</span>

              <strong>{order.status || "pending"}</strong>
            </div>
          </div>
        </div>

        {/* BUYER */}

        <div className="order-section-card">
          <div className="order-section-card__header">
            <div className="order-section-card__header-icon">
              <FaUser />
            </div>

            <div>
              <h2>Buyer information</h2>

              <p>Customer details</p>
            </div>
          </div>

          <div className="order-section-card__body">
            <div className="order-info-grid order-info-grid--buyer">
              <InfoPill
                icon={<FaUser />}
                label="Name"
                value={order.buyerName || user?.displayName || "Not specified"}
              />

              <InfoPill
                icon={<FaUsers />}
                label="Buyer ID"
                value={order.buyerId}
              />
            </div>
          </div>
        </div>

        {/* ITEMS */}

        <div className="order-items-section">
          <div className="order-items-header">
            <div className="order-items-header__icon">
              {isCollection ? (
  <FaLayerGroup />
) : isBoardGame ? (
  <FaDice />
) : (
  <FaBook />
)}
            </div>

            <div>
              <span>ORDER ITEMS</span>

              <h2>{sectionTitle}</h2>

              <p>
                {isCollection
  ? "Collection details and included books"
  : isComic
    ? "Comic details"
    : isBoardGame
      ? `${items.length} ${
          items.length === 1 ? "board game" : "board games"
        } in this order`
      : `${items.length} ${
          items.length === 1 ? "book" : "books"
        } in this order`}
              </p>
            </div>
          </div>

          {isCollection && items[0] && <CollectionOrderCard item={items[0]} />}

          {isComic && (
            <div className="order-list">
              {items.map((item, index) => (
                <ComicOrderCard
                  key={item?.id || item?.comicId || index}
                  item={item}
                  index={index + 1}
                />
              ))}
            </div>
          )}

          {!isCollection && !isComic && (
  <div className="order-list">
    {items.map((item, index) =>
      item.type === "boardGame" || isBoardGame ? (
        <BoardGameOrderCard
          key={item?.id || item?.boardGameId || index}
          item={item}
          index={index + 1}
        />
      ) : (
        <BookOrderCard
          key={item?.id || index}
          item={item}
          index={index + 1}
        />
      )
    )}
  </div>
)}
        </div>

        {/* SUMMARY */}

        <div className="order-summary">
          <div className="order-summary__header">
            <div>
              <span>ORDER SUMMARY</span>

              <h2>Order summary</h2>
            </div>
          </div>

          <div className="order-summary__grid">
            <div className="order-summary__item order-summary__item--total">
              <span>Total</span>

              <strong>${formatPrice(order.total)}</strong>
            </div>

            <div className="order-summary__item">
              <span>Status</span>

              <strong className="order-summary__status">
                <FaCheckCircle />
                {order.status || "pending"}
              </strong>
            </div>

            <div className="order-summary__item">
              <span>Order type</span>

              <strong>
              {isCollection
  ? "Collection"
  : isComic
    ? "Comic"
    : isBoardGame
      ? "Board Game"
      : "Book"}
              </strong>
            </div>

            <div className="order-summary__item">
              <span>Created</span>

             <strong>
  {formatOrderDate(order)}
</strong>
            </div>
          </div>

          {order.tradeCompleted && (
            <div className="order-summary__trade">
              <FaHandshake />

              <span>Trade successfully completed</span>
            </div>
          )}
        </div>

        {/* BACK */}

        <div className="order-details__bottom">
          {order.status === "accepted" &&
            (order.sellerId === user?.uid ||
              (Array.isArray(order.sellerIds) &&
                order.sellerIds.includes(user?.uid)) ||
              items.some((item) => item.sellerId === user?.uid)) &&
            !order.rentalCounted &&
            items.some(
  (item) =>
    item.purchaseType === "rental" &&
    item.isTrade !== true &&
    !item.tradeId,
) && (
              <button
                type="button"
                onClick={() => setShowReturnModal(true)}
                disabled={completingReturn}
                className="order-button mr-3">
                <FaCheckCircle />
                {completingReturn ? "Confirming return..." : "Confirm return"}
              </button>
            )}

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="order-button order-button--secondary">
            <FaArrowLeft />
            Back to orders
          </button>
        </div>
        {showReturnModal && (
          <div
            className="return-modal-overlay"
            onClick={() => {
              if (!completingReturn) {
                setShowReturnModal(false);
              }
            }}>
            <div
              className="return-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="return-modal-title"
              onClick={(event) => event.stopPropagation()}>
              <div className="return-modal__icon">
                <FaCheckCircle />
              </div>

              <h2 id="return-modal-title">
  Confirm {isBoardGame ? "board game" : isComic ? "comic" : "book"} return
</h2>

              <p className="return-modal__description">
                Have the rented items been returned by the buyer?
              </p>

              <p className="return-modal__warning">
                By confirming, you verify that the return is complete. This
                rental will be credited to your seller statistics.
              </p>

              <div className="return-modal__actions">
                <button
                  type="button"
                  className="return-modal__cancel"
                  disabled={completingReturn}
                  onClick={() => setShowReturnModal(false)}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="return-modal__confirm"
                  disabled={completingReturn}
                  onClick={async () => {
                    await handleConfirmReturn();
                  }}>
                  <FaCheckCircle />
                  {completingReturn ? "Confirming..." : "Confirm return"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default OrderDetailsPage;