import { useEffect } from "react";
import {
  FaTimes,
  FaTrash,
} from "react-icons/fa";

import { useCart } from "../../context/CartContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

import "./CartModal.scss";

const CartModal = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    removeFromCart,
    updateQuantity,
    updatePurchaseType,
    cartCount,
  } = useCart();

  const navigate = useNavigate();
  const { user } = useAuth();

  /* -----------------------------
     NO SCROLL
  ----------------------------- */

  useEffect(() => {
    if (isCartOpen) {
      document.body.classList.add("no-scroll");
    } else {
      document.body.classList.remove("no-scroll");
    }

    return () => {
      document.body.classList.remove("no-scroll");
    };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  /* -----------------------------
     SUBTOTAL
  ----------------------------- */

  const subtotal = cart.reduce(
    (sum, item) => {
      let price = 0;

      if (item.isTrade) {
        price = Number(item.finalPrice || 0);
      } else if (item.type === "collection") {
        price = Number(item.price || 0);
      } else if (item.purchaseType === "full") {
        price = Number(item.price || 0);
      } else {
        price = Number(item.priceLending || 0);
      }

      return (
        sum +
        price * Number(item.quantity || 1)
      );
    },
    0,
  );

  /* -----------------------------
     CHECKOUT
  ----------------------------- */

  const handleCheckout = () => {
    if (!user) {
      toast.error(
        "Log in to your account to complete your purchase!",
      );
      return;
    }

    const hasShop = cart.some(
      (item) => item.type === "shop",
    );

    const hasBook = cart.some(
      (item) => item.type === "book",
    );

    const hasCollection = cart.some(
      (item) => item.type === "collection",
    );

    /*
      COMIC
      Додаємо окрему перевірку,
      не змінюючи старі типи.
    */

    const hasComic = cart.some(
      (item) => item.type === "comic",
    );

    const hasBoardGame = cart.some(
  (item) => item.type === "boardGame"
);

    /*
      Shop, books, collections
      and comics cannot currently
      be mixed.
    */

    const cartTypes = new Set(
      cart.map((item) => item.type),
    );

    if (cartTypes.size > 1) {
      toast.error(
        "You can order items of only one type at a time. Remove other types from the cart.",
      );
      return;
    }

    if (hasBook) {
      const bookItems = cart.filter(
        (item) => item.type === "book",
      );

      if (bookItems.length > 1) {
        toast.error(
          "You can order only one book at a time.",
        );
        return;
      }
    }

    if (hasCollection) {
      const collectionItems = cart.filter(
        (item) =>
          item.type === "collection",
      );

      if (collectionItems.length > 1) {
        toast.error(
          "You can order only one collection at a time.",
        );
        return;
      }
    }

    /*
      COMICS
      Один комікс за раз,
      так само як одна книга.
    */

    if (hasComic) {
      const comicItems = cart.filter(
        (item) => item.type === "comic",
      );

      if (comicItems.length > 1) {
        toast.error(
          "You can order only one comic at a time.",
        );
        return;
      }
    }

  if (hasBoardGame) {
    const boardGameItems = cart.filter(
      (item) => item.type === "boardGame"
    );

    if (boardGameItems.length > 1) {
      toast.error(
        "You can order only one board game at a time."
      );
      return;
    }
  }

  setIsCartOpen(false);
  navigate("/checkout-payment");
};

  /* -----------------------------
     IMAGE
  ----------------------------- */

  const getItemImage = (item) => {
    if (item.type === "collection") {
      const books =
        item.books ||
        item.collection?.books ||
        [];

      const firstBook =
        books[0] || null;

      return (
        item.image ||
        item.images?.[0] ||
        item.imageUrl ||
        item.coverUrl ||
        item.collection?.image ||
        item.collection?.images?.[0] ||
        item.collection?.imageUrl ||
        item.collection?.coverUrl ||
        firstBook?.image ||
        firstBook?.images?.[0] ||
        firstBook?.imageUrl ||
        firstBook?.coverUrl ||
        ""
      );
    }

    return (
      item.image ||
      item.images?.[0] ||
      item.imageUrl ||
      ""
    );
  };

  /* -----------------------------
     NAME
  ----------------------------- */

  const getItemName = (item) => {
    if (item.type === "collection") {
      return (
        item.name ||
        item.collectionName ||
        item.collection?.collectionName ||
        item.collection?.name ||
        item.collection?.title ||
        "Book Collection"
      );
    }

    return (
      item.name ||
      item.title ||
      "Item"
    );
  };

  /* -----------------------------
     PRICE
  ----------------------------- */

const getItemPrice = (item) => {
  if (item.isTrade) {
    return Number(item.finalPrice || 0);
  }

  if (item.type === "collection") {
    return Number(item.price || 0);
  }

  if (item.purchaseType === "rental") {
    return Number(item.priceLending || 0);
  }

  return Number(item.price || 0);
};

  return (
    <div
      className="cart-modal"
      onClick={() =>
        setIsCartOpen(false)
      }
    >
      <div
        className="cart-modal__drawer"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* =========================
            HEADER
        ========================== */}

        <div className="cart-modal__header">
          <h2 className="cart-modal__title">
            {cartCount > 0
              ? "Your Cart"
              : "Cart is Empty"}
          </h2>

          <button
            onClick={() =>
              setIsCartOpen(false)
            }
            className="cart-modal__close"
          >
            <FaTimes />
          </button>
        </div>

        {/* =========================
            CART ITEMS
        ========================== */}

        <div className="cart-modal__content">

          {cartCount === 0 ? (
            <div className="cart-modal__empty">

              <p>
                Your cart is empty.
              </p>

              <button
                onClick={() =>
                  setIsCartOpen(false)
                }
                className="cart-modal__continue"
              >
                Continue Order
              </button>

            </div>
          ) : (
            <div className="cart-modal__items">

              {cart.map((item) => {

                const itemImage =
                  getItemImage(item);

                const itemName =
                  getItemName(item);

                const itemPrice =
                  getItemPrice(item);

                const isCollection =
                  item.type ===
                  "collection";

                const isBook =
                  item.type === "book";

                const isComic =
                  item.type === "comic";

                  const isBoardGame = item.type === "boardGame";

                  const listingType =
  item.listingType ??
  (
    item.isLendingAvailable ??
    Number(item.priceLending) > 0
      ? "sale_and_rental"
      : "sale"
  );

const isRentalOnly =
  (isBook || isComic || isBoardGame) &&
  listingType === "rental_only";

                const isShop =
                  item.type === "shop";

                return (
                  <div
                    key={item.id}
                    className="cart-item"
                  >

                    {/* =====================
                        IMAGE
                    ====================== */}

                    <div
                      className={`
  cart-item__image
  ${
    isCollection ||
    isBook ||
    isComic ||
    isBoardGame
      ? "cart-item__image--clickable"
      : ""
  }
`}
                      onClick={() => {

                        if (isCollection) {
                          setIsCartOpen(
                            false,
                          );

                          navigate(
                            `/book-collections?collectionId=${item.collectionId}`,
                          );
                        }

                        if (isBook) {
                          setIsCartOpen(
                            false,
                          );

                          navigate(
                            `/books?bookId=${item.id}`,
                          );
                        }

                        if (isComic) {
                          setIsCartOpen(
                            false,
                          );

                          navigate(
                            `/comics?comicId=${item.comicId || item.id}`,
                          );
                        }
                        if (isBoardGame) {
  setIsCartOpen(false);

  navigate(
    `/board-games?gameId=${item.boardGameId || item.id}`
  );
}
                      }}
                    >
                      {itemImage ? (
                        <img
                          src={itemImage}
                          alt={itemName}
                        />
                      ) : (
                        <div className="cart-item__no-image">
                          No image
                        </div>
                      )}
                    </div>

                    {/* =====================
                        INFO
                    ====================== */}

                    <div className="cart-item__info">

                      <h3
                        className={`
                          cart-item__name
                          ${
                            isCollection ||
                            isBook ||
                            isComic
                              ? "cart-item__name--clickable"
                              : ""
                          }
                        `}
                        onClick={() => {

                          if (isCollection) {
                            setIsCartOpen(
                              false,
                            );

                            navigate(
                              `/book-collections?collectionId=${item.collectionId}`,
                            );
                          }

                          if (isBook) {
                            setIsCartOpen(
                              false,
                            );

                            navigate(
                              `/books?bookId=${item.id}`,
                            );
                          }

                          if (isComic) {
                            setIsCartOpen(
                              false,
                            );

                            navigate(
                              `/comics?comicId=${item.comicId || item.id}`,
                            );
                          }
                        }}
                      >
                        {itemName}
                      </h3>

                      {/* =====================
                          COLLECTION
                      ====================== */}

                      {isCollection && (
                        <p className="cart-item__type">
                          Book Collection
                        </p>
                      )}

                      {/* =====================
                          BOOK
                      ====================== */}

                      {isBook && (
                        <p className="cart-item__type">
                          Book
                        </p>
                      )}

                      {/* =====================
                          COMIC
                      ====================== */}

                      {isComic && (
                        <p className="cart-item__type">
                          Comic
                        </p>
                      )}

                      {/* =====================
                          COMIC META
                      ====================== */}

                      {isComic && (
                        <>
                          {item.author && (
                            <p className="cart-item__books">
                              Author: {item.author}
                            </p>
                          )}

                          {item.artist && (
                            <p className="cart-item__books">
                              Artist: {item.artist}
                            </p>
                          )}

                          {(item.issue ||
                            item.volume) && (
                            <p className="cart-item__books">
                              {item.issue
                                ? `Issue ${item.issue}`
                                : ""}
                              {item.issue &&
                              item.volume
                                ? " • "
                                : ""}
                              {item.volume
                                ? `Volume ${item.volume}`
                                : ""}
                            </p>
                          )}
                        </>
                      )}

                      {/* =====================
                          PRICE
                      ====================== */}

                      <p className="cart-item__price">
                        {itemPrice.toFixed(2)} ₴
                      </p>

                      {/* =====================
                          COLLECTION COUNT
                      ====================== */}

                      {isCollection &&
                        item.collection && (
                          <p className="cart-item__books">
                            {item.collection.bookCount ||
                              item.collection.books
                                ?.length ||
                              0}{" "}
                            books
                          </p>
                        )}

                    </div>

                    {/* =====================
                        QUANTITY
                    ====================== */}

                    {isShop && (
                      <div className="cart-item__quantity">

                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity -
                                1,
                            )
                          }
                        >
                          -
                        </button>

                        <span>
                          {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            updateQuantity(
                              item.id,
                              item.quantity +
                                1,
                            )
                          }
                        >
                          +
                        </button>

                      </div>
                    )}

{/* BOOK PURCHASE TYPE */}
{isBook && !item.isTrade && (
  <div className="cart-item__purchase">
    <label className="cart-item__purchase-label">
      Select purchase type:
    </label>

    <div className="cart-item__purchase-options">
      {!isRentalOnly && (
        <label>
          <input
            type="radio"
            name={`purchase-type-${item.id}`}
            checked={item.purchaseType === "full"}
            onChange={() =>
              updatePurchaseType(item.id, "full")
            }
          />

          Buy ({Number(item.price || 0)} ₴)
        </label>
      )}

      {listingType !== "sale" && (
        <label>
          <input
            type="radio"
            name={`purchase-type-${item.id}`}
            checked={item.purchaseType === "rental"}
            onChange={() =>
              updatePurchaseType(item.id, "rental")
            }
          />

          Rental ({Number(item.priceLending || 0)} ₴)
          {item.unit ? ` / ${item.unit}` : ""}
        </label>
      )}
    </div>
  </div>
)}

                    {/* =====================
                        COMIC PURCHASE TYPE
                    ====================== */}

{isComic && !item.isTrade && (
  <div className="cart-item__purchase">
    <label className="cart-item__purchase-label">
      Select purchase type:
    </label>

    <div className="cart-item__purchase-options">
      {!isRentalOnly && (
        <label>
          <input
            type="radio"
            name={`purchase-type-${item.id}`}
            checked={item.purchaseType === "full"}
            onChange={() =>
              updatePurchaseType(item.id, "full")
            }
          />

          Buy ({Number(item.price || 0)} ₴)
        </label>
      )}

      {listingType !== "sale" && (
        <label>
          <input
            type="radio"
            name={`purchase-type-${item.id}`}
            checked={item.purchaseType === "rental"}
            onChange={() =>
              updatePurchaseType(item.id, "rental")
            }
          />

          Rental ({Number(item.priceLending || 0)} ₴)
          {item.unit ? ` / ${item.unit}` : ""}
        </label>
      )}
    </div>
  </div>
)}
{/* =====================
    BOARD GAME PURCHASE TYPE
====================== */}

{isBoardGame && !item.isTrade && (
  <div className="cart-item__purchase">
    <label className="cart-item__purchase-label">
      Select purchase type:
    </label>

    <div className="cart-item__purchase-options">
      {!isRentalOnly && (
        <label>
          <input
            type="radio"
            name={`purchase-type-${item.id}`}
            checked={item.purchaseType === "full"}
            onChange={() =>
              updatePurchaseType(item.id, "full")
            }
          />

          Buy ({Number(item.price || 0)} ₴)
        </label>
      )}

      {listingType !== "sale" && (
        <label>
          <input
            type="radio"
            name={`purchase-type-${item.id}`}
            checked={item.purchaseType === "rental"}
            onChange={() =>
              updatePurchaseType(item.id, "rental")
            }
          />

          Rental ({Number(item.priceLending || 0)} ₴)
          {item.unit ? ` ${item.unit}` : ""}
        </label>
      )}
    </div>
  </div>
)}
                    {/* =====================
                        REMOVE
                    ====================== */}

                    <div className="cart-item__remove-wrapper">

                      <button
                        onClick={() =>
                          removeFromCart(
                            item.id,
                          )
                        }
                        className="cart-item__remove"
                        title="Remove from cart"
                      >
                        <FaTrash />
                      </button>

                    </div>

                  </div>
                );
              })}

            </div>
          )}
        </div>

        {/* =========================
            FOOTER
        ========================== */}

        {cartCount > 0 && (
          <div className="cart-modal__footer">

            <div className="cart-modal__subtotal">

              <span>
                Subtotal:
              </span>

              <span>
                {subtotal.toFixed(2)} ₴
              </span>

            </div>

            <button
              onClick={handleCheckout}
              className="cart-modal__checkout"
            >
              Proceed to Checkout
            </button>

          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;