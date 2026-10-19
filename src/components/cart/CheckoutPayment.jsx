import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc
} from "firebase/firestore";
import { toast } from "react-toastify";
import emailjs from "@emailjs/browser";
import { FaRegCopy } from "react-icons/fa";

import "./CheckoutPayment.scss";

const getListingType = (item) => {
  if (item?.listingType) {
    return item.listingType;
  }

  const lendingAvailable =
    item?.isLendingAvailable ??
    (Number(item?.priceLending) > 0);

  return lendingAvailable
    ? "sale_and_rental"
    : "sale";
};

const getPurchaseType = (item) => {
  return item?.purchaseType ||
    (getListingType(item) === "rental_only" ? "rental" : "full");
};

const getOrderItemPrice = (item) => {
  if (item.isTrade) {
    return Number(item.finalPrice ?? item.price ?? 0);
  }

  return getPurchaseType(item) === "rental"
    ? Number(item.priceLending || 0)
    : Number(item.price || 0);
};

export const CheckoutPayment = () => {
  const { cart, clearCart } = useCart();

  const { user } = useAuth();
  const navigate = useNavigate();

  const shopItems = cart.filter(
    (item) => item.type === "shop"
  );

  const bookItems = cart.filter(
    (item) => item.type === "book"
  );

  const collectionItems = cart.filter(
    (item) => item.type === "collection"
  );

  /*
   * COMICS
   */
  const comicItems = cart.filter(
    (item) => item.type === "comic"
  );
  const boardGameItems = cart.filter(
  (item) => item.type === "boardGame"
);

  const [step, setStep] = useState(1);

  const [orderNumber] = useState(() => {
    const random = Math.floor(
      100000 + Math.random() * 900000
    );

    return `ORD-${Date.now()}-${random}`;
  });

  const [formData, setFormData] = useState({
    fullName: "",
    email: user?.email || "",
    phone: "+380",
    city: "",
    postalService: "novaPoshta",
    postalOffice: "",
  });

  const totalShopAmount = shopItems.reduce(
    (sum, item) =>
      sum +
      Number(item.price) *
        (item.quantity || 1),
    0
  );

const totalBookAmount = bookItems.reduce(
  (sum, item) => sum + getOrderItemPrice(item),
  0
);

  const totalCollectionAmount =
    collectionItems.reduce(
      (sum, item) =>
        sum +
        Number(
          item.finalPrice ??
            item.price ??
            0
        ),
      0
    );

  /*
   * COMIC TOTAL
   */
const totalComicAmount = comicItems.reduce(
  (sum, item) => sum + getOrderItemPrice(item),
  0
);
const totalBoardGameAmount = boardGameItems.reduce(
  (sum, item) => sum + getOrderItemPrice(item),
  0
);

const totalAmount =
  totalShopAmount +
  totalBookAmount +
  totalCollectionAmount +
  totalComicAmount +
  totalBoardGameAmount;

  const handleChange = (e) =>
    setFormData({
      ...formData,
      [e.target.name]:
        e.target.value,
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error(
        "You are not authorized."
      );

      return;
    }

    const activeTypes = [
      shopItems.length > 0
        ? "shop"
        : null,

      bookItems.length > 0
        ? "book"
        : null,

      collectionItems.length > 0
        ? "collection"
        : null,

      /*
       * COMIC
       */
     comicItems.length > 0
  ? "comic"
  : null,

boardGameItems.length > 0
  ? "boardGame"
  : null,
].filter(Boolean);

    if (activeTypes.length === 0) {
      toast.error(
        "Your cart is empty."
      );

      return;
    }

    if (activeTypes.length > 1) {
      toast.error(
        "Remove other types. You can order only one type at a time."
      );

      return;
    }

    const phoneDigits =
      formData.phone.replace(
        /\D/g,
        ""
      );

    if (
      phoneDigits.length !== 12
    ) {
      toast.error(
        "Phone number must be exactly 9 digits after +380"
      );

      return;
    }

    if (shopItems.length > 0) {
      setStep(2);
      return;
    }

    if (bookItems.length > 0) {
      await handleBookOrders();
      return;
    }

    if (collectionItems.length > 0) {
      await handleCollectionOrders();
      return;
    }

    /*
     * COMIC ORDER
     */
    if (comicItems.length > 0) {
      await handleComicOrders();
      return;
    }
    if (boardGameItems.length > 0) {
  await handleBoardGameOrders();
  return;
}
  };

  const removeUndefined = (
    value
  ) => {
    if (value === undefined) {
      return null;
    }

    if (value === null) {
      return null;
    }

    if (Array.isArray(value)) {
      return value.map(
        removeUndefined
      );
    }

    if (
      typeof value === "object"
    ) {
      // Firestore Timestamp / FieldValue / Date
      // залишаємо як є
      if (
        typeof value.toDate ===
          "function" ||
        value.constructor?.name ===
          "FieldValue" ||
        value.constructor?.name ===
          "Timestamp" ||
        value instanceof Date
      ) {
        return value;
      }

      const cleaned = {};

      Object.entries(value).forEach(
        ([key, val]) => {
          cleaned[key] =
            val === undefined
              ? null
              : removeUndefined(val);
        }
      );

      return cleaned;
    }

    return value;
  };



const validateCartAvailability = async () => {
  const checkedProducts = new Set();

  for (const item of cart) {
    if (
  item.type !== "book" &&
  item.type !== "comic" &&
  item.type !== "boardGame"
) {
  continue;
}

    const isTrade = item.isTrade === true || Boolean(item.tradeId);

const productId =
  item.type === "comic"
    ? item.comicId || item.id
    : item.type === "boardGame"
    ? item.boardGameId || item.id
    : item.bookId || item.id;

    if (!productId) {
      toast.error("Could not identify a product in your cart.");
      return false;
    }

const collectionName =
  item.type === "comic"
    ? "comics"
    : item.type === "boardGame"
    ? "boardGames"
    : "books";

    const productKey = `${collectionName}:${productId}`;

    if (checkedProducts.has(productKey)) {
      toast.error(
        `"${item.name || "Product"}" appears more than once in your cart.`
      );
      return false;
    }

    checkedProducts.add(productKey);

    try {
      const productSnap = await getDoc(
        doc(db, collectionName, productId)
      );

      if (!productSnap.exists()) {
        toast.error(
          `"${item.name || "Product"}" no longer exists. Remove it from your cart.`
        );
        return false;
      }

      const productData = productSnap.data();

      if (
        productData.isCurrentlyRented === true ||
        productData.activeRentalOrderId
      ) {
        toast.error(
          `"${item.name || "Product"}" is currently rented and unavailable.`
        );
        return false;
      }

      if (productData.sellerId !== item.sellerId) {
        toast.error(
          `"${item.name || "Product"}" has outdated seller information. Please add it again.`
        );
        return false;
      }

      const listingType = getListingType(productData);
      const purchaseType = getPurchaseType(item);

      if (purchaseType !== "full" && purchaseType !== "rental") {
        toast.error("Invalid purchase type.");
        return false;
      }

      if (isTrade) {
        if (listingType === "rental_only") {
          toast.error(
            `"${item.name || "Product"}" is no longer available for sale or trade.`
          );
          return false;
        }

        continue;
      }

      if (purchaseType === "rental") {
        const rentalPrice = Number(productData.priceLending);

        if (
          listingType === "sale" ||
          !Number.isFinite(rentalPrice) ||
          rentalPrice <= 0
        ) {
          toast.error(
            `"${item.name || "Product"}" is no longer available for rental.`
          );
          return false;
        }

        if (
          Number(item.priceLending) !== rentalPrice
        ) {
          toast.error(
            `Rental price for "${item.name || "Product"}" has changed. Please add it to your cart again.`
          );
          return false;
        }
      }

      if (purchaseType === "full") {
        const salePrice = Number(productData.price);

        if (
          listingType === "rental_only" ||
          productData.price == null ||
          !Number.isFinite(salePrice) ||
          salePrice < 0
        ) {
          toast.error(
            `"${item.name || "Product"}" is no longer available for sale.`
          );
          return false;
        }

        if (Number(item.price) !== salePrice) {
          toast.error(
            `Sale price for "${item.name || "Product"}" has changed. Please add it to your cart again.`
          );
          return false;
        }
      }
    } catch (error) {
      console.error("Cart availability check failed:", error);
      toast.error(
        "Could not verify cart items. Please try again."
      );
      return false;
    }
  }

  return true;
};



  const handleBookOrders =
    async () => {
      const isAvailable = await validateCartAvailability();

if (!isAvailable) return;
      try {
        for (const item of bookItems) {
  const listingType = getListingType(item);
  const purchaseType = getPurchaseType(item);

  if (
    purchaseType === "rental" &&
    (
      listingType === "sale" ||
      Number(item.priceLending) <= 0
    )
  ) {
    toast.error(
      `Rental is not available for ${item.name}`
    );

    return;
  }

  if (
    listingType === "rental_only" &&
    purchaseType !== "rental"
  ) {
    toast.error(
      `${item.name} can only be rented.`
    );

    return;
  }
}

        const sellerIds =
          bookItems
            .map(
              (item) =>
                item.sellerId
            )
            .filter(Boolean);

        /*
         * CLEAN BOOK ITEMS
         */
        const cleanBookItems = bookItems.map((item) => {
  const listingType = getListingType(item);
  const purchaseType = getPurchaseType(item);
  const isLendingAvailable = listingType !== "sale";

  return {
                id:
                  item.id ?? null,

                type:
                  "book",

                name:
                  item.name ??
                  item.title ??
                  "Book",

                quantity:
                  Number(
                    item.quantity ??
                      1
                  ),

                price:
  listingType === "rental_only"
    ? null
    : Number(item.price ?? 0),

listingType,

                pages:
                  item.pages !=
                  null
                    ? Number(
                        item.pages
                      )
                    : null,

                language:
                  item.language ??
                  null,

                condition:
                  item.condition ??
                  null,

                isLendingAvailable,

                priceLending:
                  isLendingAvailable
                    ? Number(
                        item.priceLending ??
                          0
                      )
                    : null,

                unit:
                  isLendingAvailable
                    ? item.unit ||
                      null
                    : null,

            purchaseType,

                image:
                  item.image ??
                  item.images?.[0] ??
                  "",

                finalPrice:
  item.isTrade && item.finalPrice != null
    ? Number(item.finalPrice)
    : getOrderItemPrice(item),

                tradeId:
                  item.tradeId ??
                  null,

                isTrade:
                  item.isTrade ===
                  true,

                sellerId:
                  item.sellerId ??
                  null,

                sellerName:
                  item.sellerName ??
                  "",

                sellerPhoto:
                  item.sellerPhoto ??
                  null,
              };
            }
          );

        /*
         * TRADE ID
         */
        const tradeId =
          cleanBookItems[0]
            ?.tradeId ?? null;

        /*
         * ORDER
         */
        const orderData = {
          type:
            "book",

          buyerId:
            user.uid,

          orderNumber,

          items:
            cleanBookItems,

          sellerIds,

          shipping: {
            fullName:
              formData.fullName ??
              "",

            email:
              formData.email ??
              "",

            phone:
              formData.phone ??
              "",

            city:
              formData.city ??
              "",

            postalService:
              formData.postalService ??
              "",

            postalOffice:
              formData.postalOffice ??
              "",
          },

          total:
            Number(
              totalBookAmount
            ) || 0,

          status:
            "pending",

          tradeId,

          createdAt:
            serverTimestamp(),
        };

        /*
         * CREATE ORDER
         */
        console.log(
          "FINAL BOOK ORDER:",
          orderData
        );

        const orderRef =
          await addDoc(
            collection(
              db,
              "orders"
            ),
            orderData
          );

        /*
         * COMPLETE TRADE
         */
        if (tradeId) {
          await updateDoc(
            doc(
              db,
              "tradeOffers",
              tradeId
            ),
            {
              status:
                "completed",

              buyerRead:
                false,

              orderId:
                orderRef.id,

              completedAt:
                serverTimestamp(),
            }
          );
        }

        toast.success(
          "Book order created!"
        );

        clearCart();

        navigate("/");
      } catch (error) {
        console.error(
          "BOOK ORDER ERROR:",
          error
        );

        console.error(
          "BOOK ITEMS:",
          bookItems
        );

        toast.error(
          error?.message ||
            "Book order error"
        );
      }
    };

  const handleCollectionOrders =
    async () => {
      try {
        const item =
          collectionItems[0];

        if (!item) {
          toast.error(
            "Collection not found in cart."
          );

          return;
        }

        /*
         * BOOKS
         */
        const cleanBooks =
          Array.isArray(
            item.books
          )
            ? item.books.map(
                (book) => ({
                  id:
                    book?.id ??
                    null,

                  name:
                    book?.name ??
                    "",

                  title:
                    book?.title ??
                    "",

                  author:
                    book?.author ??
                    "",

                  year:
                    book?.year !=
                    null
                      ? Number(
                          book.year
                        )
                      : null,

                  pages:
                    book?.pages !=
                    null
                      ? Number(
                          book.pages
                        )
                      : null,

                  language:
                    book?.language ??
                    null,

                  condition:
                    book?.condition ??
                    null,

                  description:
                    book?.description ??
                    "",

                  image:
                    book?.image ??
                    book
                      ?.images?.[0] ??
                    "",

                  images:
                    Array.isArray(
                      book?.images
                    )
                      ? book.images.filter(
                          Boolean
                        )
                      : [],

                  price:
                    Number(
                      book?.price ??
                        0
                    ),
                })
              )
            : [];

        /*
         * TRADE
         */
        const tradeId =
          item.tradeId ?? null;

        const isTrade =
          item.isTrade === true;

        const finalPrice =
          isTrade &&
          item.finalPrice !=
            null
            ? Number(
                item.finalPrice
              )
            : null;

        /*
         * FINAL PRICE
         */
        const orderPrice =
          isTrade &&
          finalPrice !== null
            ? finalPrice
            : Number(
                item.price ?? 0
              );

        /*
         * COLLECTION
         */
        const cleanItem = {
          id:
            item.id ?? null,

          collectionId:
            item.collectionId ??
            item.id ??
            null,

          type:
            "collection",

          name:
            item.name ??
            item.collectionName ??
            "Book Collection",

          collectionName:
            item.collectionName ??
            item.name ??
            "Book Collection",

          image:
            item.image ??
            item.images?.[0] ??
            cleanBooks[0]?.image ??
            "",

          price:
            Number(
              item.price ?? 0
            ),

          finalPrice,

          bookCount:
            Number(
              item.bookCount ??
                cleanBooks.length ??
                0
            ),

          books:
            cleanBooks,

          sellerId:
            item.sellerId ??
            null,

          sellerName:
            item.sellerName ??
            "",

          purchaseType:
            "full",

          quantity:
            1,

          isTrade,

          tradeId,

          orderPrice,
        };

        /*
         * SELLER
         */
        const sellerIds =
          cleanItem.sellerId
            ? [cleanItem.sellerId]
            : [];

        /*
         * COLLECTION ID
         */
        const collectionId =
          cleanItem.collectionId;

        /*
         * DEBUG
         */
        console.log(
          "COLLECTION ORDER ITEM:",
          cleanItem
        );

        console.log(
          "TRADE:",
          {
            isTrade,
            tradeId,
            finalPrice,
            orderPrice,
          }
        );

        /*
         * ORDER
         */
        const orderData = {
          type:
            "collection",

          buyerId:
            user.uid,

          orderNumber,

          items:
            [cleanItem],

          sellerIds,

          shipping: {
            fullName:
              formData.fullName ??
              "",

            email:
              formData.email ??
              "",

            phone:
              formData.phone ??
              "",

            city:
              formData.city ??
              "",

            postalService:
              formData.postalService ??
              "",

            postalOffice:
              formData.postalOffice ??
              "",
          },

          total:
            Number(orderPrice) ||
            0,

          status:
            "pending",

          collectionId,

          tradeId,

          createdAt:
            serverTimestamp(),
        };

        /*
         * CREATE ORDER
         */
        console.log(
          "FINAL COLLECTION ORDER:",
          orderData
        );

        const orderRef =
          await addDoc(
            collection(
              db,
              "orders"
            ),
            orderData
          );

        /*
         * COMPLETE TRADE
         */
        if (tradeId) {
          await updateDoc(
            doc(
              db,
              "tradeOffers",
              tradeId
            ),
            {
              status:
                "completed",

              buyerRead:
                false,

              orderId:
                orderRef.id,

              completedAt:
                serverTimestamp(),
            }
          );
        }

        toast.success(
          "Collection order created!"
        );

        clearCart();

        navigate("/");
      } catch (error) {
        console.error(
          "COLLECTION ORDER ERROR:",
          error
        );

        console.error(
          "COLLECTION ITEMS:",
          collectionItems
        );

        toast.error(
          error?.message ||
            "Collection order error"
        );
      }
    };

  /*
   * ==========================================
   * COMIC ORDERS
   * ==========================================
   */

  const handleComicOrders =
    async () => {
      const isAvailable = await validateCartAvailability();

if (!isAvailable) return;
      try {
        /*
         * Перевіряємо lending
         */
       for (const item of comicItems) {
  const listingType = getListingType(item);
  const purchaseType = getPurchaseType(item);

  if (
    purchaseType === "rental" &&
    (
      listingType === "sale" ||
      Number(item.priceLending) <= 0
    )
  ) {
    toast.error(
      `Rental is not available for ${item.name}`
    );

    return;
  }

  if (
    listingType === "rental_only" &&
    purchaseType !== "rental"
  ) {
    toast.error(
      `${item.name} can only be rented.`
    );

    return;
  }
}

        /*
         * SELLERS
         */
        const sellerIds =
          comicItems
            .map(
              (item) =>
                item.sellerId
            )
            .filter(Boolean);

        /*
         * CLEAN COMIC ITEMS
         */
      const cleanComicItems = comicItems.map((item) => {
  const listingType = getListingType(item);
  const purchaseType = getPurchaseType(item);
  const isLendingAvailable = listingType !== "sale";

  const price =
    listingType === "rental_only"
      ? null
      : Number(item.price ?? 0);

              const priceLending =
                isLendingAvailable
                  ? Number(
                      item.priceLending ??
                        0
                    )
                  : null;

              /*
               * Якщо finalPrice вже
               * є в CartContext —
               * використовуємо його.
               *
               * Якщо немає —
               * рахуємо тут.
               */
             const finalPrice =
  item.isTrade && item.finalPrice != null
    ? Number(item.finalPrice)
    : getOrderItemPrice(item);

              return {
                /*
                 * IDs
                 */
                id:
                  item.id ?? null,

                comicId:
                  item.comicId ??
                  item.id ??
                  null,

                type:
                  "comic",

                /*
                 * BASIC DATA
                 */
                name:
                  item.name ??
                  "Untitled Comic",

                author:
                  item.author ??
                  "",

                artist:
                  item.artist ??
                  "",

                publisher:
                  item.publisher ??
                  "",

                issue:
                  item.issue ??
                  "",

                volume:
                  item.volume ??
                  "",

                year:
                  item.year != null
                    ? Number(
                        item.year
                      )
                    : null,

                genre:
                  item.genre ??
                  "",

                pages:
                  item.pages != null
                    ? Number(
                        item.pages
                      )
                    : null,

                language:
                  item.language ??
                  null,

                condition:
                  item.condition ??
                  null,

                description:
                  item.description ??
                  "",

                /*
                 * IMAGES
                 */
                images:
                  Array.isArray(
                    item.images
                  )
                    ? item.images.filter(
                        Boolean
                      )
                    : [],

                image:
                  item.image ??
                  item.images?.[0] ??
                  "",

               /*
 * PRICES
 */
price,

listingType,

isLendingAvailable,

priceLending:
  isLendingAvailable
    ? Number(item.priceLending ?? 0)
    : null,

                unit:
                  isLendingAvailable
                    ? item.unit ||
                      null
                    : null,

                purchaseType,

                finalPrice,

                quantity:
                  Number(
                    item.quantity ??
                      1
                  ),

                /*
                 * SELLER
                 */
                sellerId:
                  item.sellerId ??
                  null,

                sellerName:
                  item.sellerName ??
                  "",

                sellerPhoto:
                  item.sellerPhoto ??
                  null,

                /*
                 * TRADE
                 */
                tradeId:
                  item.tradeId ??
                  null,

                isTrade:
                  item.isTrade ===
                  true,
              };
            }
          );

        /*
         * TRADE ID
         *
         * Так само, як у book order.
         */
        const tradeId =
          cleanComicItems[0]
            ?.tradeId ?? null;

        /*
         * FINAL ORDER TOTAL
         */
        const orderPrice =
          cleanComicItems.reduce(
            (sum, item) => {
              const price =
                item.isTrade &&
                item.finalPrice !=
                  null
                  ? Number(
                      item.finalPrice
                    )
                  : item.purchaseType ===
                    "rental"
                  ? Number(
                      item.priceLending ??
                        0
                    )
                  : Number(
                      item.price ?? 0
                    );

              return sum + price;
            },
            0
          );

        /*
         * ORDER
         */
        const orderData = {
          type:
            "comic",

          buyerId:
            user.uid,

          orderNumber,

          items:
            cleanComicItems,

          sellerIds,

          shipping: {
            fullName:
              formData.fullName ??
              "",

            email:
              formData.email ??
              "",

            phone:
              formData.phone ??
              "",

            city:
              formData.city ??
              "",

            postalService:
              formData.postalService ??
              "",

            postalOffice:
              formData.postalOffice ??
              "",
          },

          total:
            Number(orderPrice) ||
            0,

          status:
            "pending",

          tradeId,

          createdAt:
            serverTimestamp(),
        };

        /*
         * DEBUG
         */
        console.log(
          "FINAL COMIC ORDER:",
          orderData
        );

        /*
         * CREATE ORDER
         */
        const orderRef =
          await addDoc(
            collection(
              db,
              "orders"
            ),
            orderData
          );

        /*
         * COMPLETE TRADE
         */
        if (tradeId) {
          await updateDoc(
            doc(
              db,
              "tradeOffers",
              tradeId
            ),
            {
              status:
                "completed",

              buyerRead:
                false,

              orderId:
                orderRef.id,

              completedAt:
                serverTimestamp(),
            }
          );
        }

        toast.success(
          "Comic order created!"
        );

        clearCart();

        navigate("/");
      } catch (error) {
        console.error(
          "COMIC ORDER ERROR:",
          error
        );

        console.error(
          "COMIC ITEMS:",
          comicItems
        );

        toast.error(
          error?.message ||
            "Comic order error"
        );
      }
    };

    const handleBoardGameOrders = async () => {
  const isAvailable = await validateCartAvailability();

  if (!isAvailable) return;

  try {
    if (boardGameItems.length !== 1) {
      toast.error(
        "You can order only one board game at a time."
      );
      return;
    }

    const item = boardGameItems[0];

    const boardGameId =
      item.boardGameId || item.id;

    if (!boardGameId || !item.sellerId) {
      toast.error(
        "Board game or seller information is missing."
      );
      return;
    }

    if (item.sellerId === user.uid) {
      toast.error(
        "You cannot order your own board game."
      );
      return;
    }

    const listingType = getListingType(item);
    const purchaseType = getPurchaseType(item);

    if (
      purchaseType !== "full" &&
      purchaseType !== "rental"
    ) {
      toast.error("Invalid purchase type.");
      return;
    }

    if (
      purchaseType === "rental" &&
      (
        listingType === "sale" ||
        Number(item.priceLending) <= 0
      )
    ) {
      toast.error(
        "This board game is not available for rental."
      );
      return;
    }

    if (
      purchaseType === "full" &&
      listingType === "rental_only"
    ) {
      toast.error(
        "This board game is available for rental only."
      );
      return;
    }

    const orderPrice = getOrderItemPrice(item);

    if (
      !Number.isFinite(orderPrice) ||
      orderPrice <= 0
    ) {
      toast.error("Invalid board game price.");
      return;
    }

    const cleanBoardGameItem = {
      id: boardGameId,
      boardGameId,
      type: "boardGame",

      name: item.name || "Board Game",
      publisher: item.publisher || "",
      category: item.category || "",

      year:
        item.year != null
          ? Number(item.year)
          : null,

      minPlayers:
        item.minPlayers != null
          ? Number(item.minPlayers)
          : null,

      maxPlayers:
        item.maxPlayers != null
          ? Number(item.maxPlayers)
          : null,

      playTime:
        item.playTime != null
          ? Number(item.playTime)
          : null,

      minAge:
        item.minAge != null
          ? Number(item.minAge)
          : null,

      language: item.language || null,
      condition: item.condition || null,
      completeness: item.completeness || null,
      description: item.description || "",

      image:
        item.image ||
        item.images?.[0] ||
        "",

      images: Array.isArray(item.images)
        ? item.images.filter(Boolean)
        : [],

      listingType,
      purchaseType,

      price:
        listingType === "rental_only"
          ? null
          : Number(item.price ?? 0),

      isLendingAvailable:
        listingType !== "sale",

      priceLending:
        listingType !== "sale"
          ? Number(item.priceLending ?? 0)
          : null,

      unit:
        listingType !== "sale"
          ? item.unit || null
          : null,

      finalPrice: orderPrice,
      quantity: 1,

      sellerId: item.sellerId,
      sellerName: item.sellerName || "",
      sellerPhoto: item.sellerPhoto || null,

isTrade: item.isTrade === true || Boolean(item.tradeId),
tradeId: item.tradeId || null,
    };

    const orderData = {
      type: "boardGame",

      buyerId: user.uid,
      orderNumber,

      items: [cleanBoardGameItem],

      sellerIds: [item.sellerId],
      sellerId: item.sellerId,

      shipping: {
        fullName: formData.fullName || "",
        email: formData.email || "",
        phone: formData.phone || "",
        city: formData.city || "",
        postalService:
          formData.postalService || "",
        postalOffice:
          formData.postalOffice || "",
      },

      total: orderPrice,

      status: "pending",

isTrade: item.isTrade === true || Boolean(item.tradeId),
tradeId: item.tradeId || null,

      rentalCounted: false,

      createdAt: serverTimestamp(),
    };

    // const cleanedOrderData =
    //   removeUndefined(orderData);

    // const orderRef = await addDoc(
    //   collection(db, "orders"),
    //   cleanedOrderData
    // );
    const cleanedOrderData = removeUndefined(orderData);

cleanedOrderData.createdAt = serverTimestamp();

const orderRef = await addDoc(
  collection(db, "orders"),
  cleanedOrderData
);

    console.log(
      "BOARD GAME ORDER CREATED:",
      orderRef.id
    );

    toast.success(
      "Board game order created!"
    );

    clearCart();

    navigate("/");
  } catch (error) {
    console.error(
      "BOARD GAME ORDER ERROR:",
      error
    );

    toast.error(
      error?.message ||
      "Could not create board game order."
    );
  }
};

  const handleShopConfirm =
    async () => {
      try {
        const itemsDetailed =
          shopItems.map(
            (item) => ({
              name:
                item.name,

              quantity:
                item.quantity,

              price:
                item.price,

              total:
                Number(item.price) *
                (
                  item.quantity ||
                  1
                ),
            })
          );

        const message = `
      🧾 SHOP ORDER

      Order: ${orderNumber}

      Customer: ${formData.fullName}
      Email: ${formData.email}
      Phone: ${formData.phone}
      City: ${formData.city}
      Postal Service: ${formData.postalService}
      Department: ${formData.postalOffice}

      Items:
      ${itemsDetailed
        .map(
          (i) =>
            `${i.name} x${i.quantity} = ${i.total}₴`
        )
        .join("\n")}

      TOTAL: ${totalShopAmount}₴
    `;

        await emailjs.send(
          "service_hllb7p1",
          "template_gdn6fcv",
          { message },
          "v13Oo-YtABqCO9JLF"
        );

        await addDoc(
        collection(db, "orders"),
        removeUndefined({
          type: "shop",

          buyerId: user.uid,

          orderNumber,

          items: shopItems,

          shipping: formData,

          total: totalShopAmount,

          status: "pending",

          createdAt: serverTimestamp(),
        })
      );

        setStep(3);

        setFinalTotal(
          totalShopAmount
        );

        setFinalItems(
          shopItems
        );

        clearCart();

        toast.success(
          "Order received!"
        );
      } catch (error) {
        console.error(error);

        toast.error(
          "Shop order error"
        );
      }
    };

  const handlePrint = () => {
    const printContent =
      document.getElementById(
        "receipt"
      ).innerHTML;

    const newWin =
      window.open(
        "",
        "_blank"
      );

    newWin.document.write(
      `<html><head><title>Receipt</title></head><body>${printContent}</body></html>`
    );

    newWin.document.close();

    newWin.print();

    newWin.close();
  };

  const [
    finalTotal,
    setFinalTotal,
  ] = useState(0);

  const [
    finalItems,
    setFinalItems,
  ] = useState([]);

  return (
<div className="checkout-payment">
      <div className="checkout-payment__panel">

        <h2 className="text-2xl font-bold mb-6 text-center text-[var(--secondary-color)]">
          {step === 1
            ? "Step 1: Shipping Details"
            : step === 2
            ? "Step 2: Payment Instructions"
            : "Step 3: Receipt"}
        </h2>

        {step === 1 && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <div className="text-red-500 text-base">
              * Be sure to provide your real first and last name to place an order (full name and surname in Ukrainian)
            </div>

            <input
              type="text"
              name="fullName"
              placeholder="First and Last name"
              value={
                formData.fullName
              }
              onChange={
                handleChange
              }
              className="p-2 rounded border text-black"
              required
            />

            <div>
              * Be sure to enter the email address of the account you registered on the site to place an order.
            </div>

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={
                formData.email
              }
              onChange={
                handleChange
              }
              className="p-2 rounded border text-gray-900 dark:text-white"
              required
            />

            <input
              type="tel"
              name="phone"
              value={
                formData.phone
              }
              onChange={(e) => {
                let value =
                  e.target.value;

                if (
                  !value.startsWith(
                    "+380"
                  )
                ) {
                  value = "+380";
                }

                const digits =
                  value.replace(
                    /\D/g,
                    ""
                  );

                if (
                  digits.length > 12
                ) {
                  return;
                }

                setFormData({
                  ...formData,
                  phone: value,
                });
              }}
              required
              className="p-2 rounded border text-gray-900 dark:text-white"
            />

            <input
              type="text"
              name="city"
              placeholder="City"
              value={
                formData.city
              }
              onChange={
                handleChange
              }
              className="p-2 rounded border text-gray-900 dark:text-white"
              required
            />

            <select
              name="postalService"
              value={
                formData.postalService
              }
              onChange={
                handleChange
              }
              className="p-2 rounded border text-gray-900 dark:text-white"
            >
              <option value="novaPoshta">
                Nova Poshta
              </option>

              <option value="ukrPoshta">
                Ukrposhta
              </option>
            </select>

            <input
              type="text"
              name="postalOffice"
              placeholder="Department"
              value={
                formData.postalOffice
              }
              onChange={
                handleChange
              }
              className="p-2 rounded border text-gray-900 dark:text-white"
              required
            />

            <button
              type="submit"
              className="py-3 bg-[var(--secondary-color)] dark:bg-[var(--secondary-color)] hover:bg-[var(--secondary-color-hover)] hover:dark:bg-[var(--secondary-color-hover)] text-white rounded"
            >
              {/* Proceed to Checkout */}
              Order & Next
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4 items-center">

            <div className="flex items-center gap-2">

              <p>
                <b>Order:</b>{" "}
                {orderNumber}
              </p>

              <FaRegCopy
                className="cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(
                    orderNumber
                  );

                  toast.success(
                    "Order number copied"
                  );
                }}
              />

            </div>

            <p>
              <b>Total:</b>{" "}
              {totalShopAmount}₴
            </p>

            <div className="bg-black text-white p-4 rounded flex justify-between items-center w-full">

              <span
                style={{
                  letterSpacing:
                    "2px",
                  fontSize:
                    "1.2rem",
                }}
              >
                4790 7299 2893 6954
              </span>

              <FaRegCopy
                className="cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(
                    "4790729928936954"
                  );

                  toast.success(
                    "Card copied"
                  );
                }}
              />

            </div>

            <p className="text-red-500 font-semibold text-center">
              IMPORTANT: Enter order number in payment description
            </p>

            <button
              onClick={
                handleShopConfirm
              }
              className="py-3 bg-green-600 text-white rounded w-full"
            >
              I Paid, Confirm Order
            </button>

          </div>
        )}

        {step === 3 && (
          <div
            id="receipt"
            className="text-black bg-white p-6 rounded shadow"
          >
            <h3 className="text-2xl font-bold mb-4 text-center">
              Payment Receipt
            </h3>

            <div className="border p-4 mb-4 rounded text-center bg-gray-100">
              <p className="font-bold text-lg">
                Payment Instructions
              </p>

              <p>
                Total:{" "}
                {finalTotal}₴
              </p>

              <p className="text-lg font-bold">
                4790 7299 2893 6954
              </p>
            </div>

            <p>
              <b>Order:</b>{" "}
              {orderNumber}
            </p>

            <p>
              <b>Name:</b>{" "}
              {formData.fullName}
            </p>

            <p>
              <b>Email:</b>{" "}
              {formData.email}
            </p>

            <p>
              <b>Phone:</b>{" "}
              {formData.phone}
            </p>

            <p>
              <b>City:</b>{" "}
              {formData.city}
            </p>

            <p>
              <b>Postal Service:</b>{" "}
              {formData.postalService}
            </p>

            <p>
              <b>Department:</b>{" "}
              {formData.postalOffice}
            </p>

            <div className="mt-4">

              <b>Items:</b>

              {finalItems.map(
                (i, idx) => (
                  <div
                    key={idx}
                    className="mb-3"
                  >
                    <p>
                      {i.name} x
                      {i.quantity ||
                        1}{" "}
                      ={" "}
                      {
                        i.finalPrice ??
                        (
                          i.purchaseType ===
                          "rental"
                            ? i.priceLending
                            : i.price
                        )
                      }
                      ₴
                    </p>

                    {(i.pages ||
                      i.language ||
                      i.condition) && (
                      <p className="text-sm text-gray-500">

                        {i.pages &&
                          `${i.pages} pages`}

                        {i.pages &&
                          i.language &&
                          " • "}

                        {i.language &&
                          i.language}

                        {(i.pages ||
                          i.language) &&
                          i.condition &&
                          " • "}

                        {i.condition &&
                          i.condition}

                      </p>
                    )}
                  </div>
                )
              )}

            </div>

            <p className="mt-4 font-bold text-lg">
              Total:{" "}
              {finalTotal}₴
            </p>

            <div className="flex gap-3 mt-6">

              <button
                onClick={
                  handlePrint
                }
                className="px-4 py-2 bg-[var(--secondary-color)] text-white rounded w-full"
              >
                Print
              </button>

              <button
                onClick={() =>
                  navigate("/")
                }
                className="px-4 py-2 bg-gray-500 text-white rounded w-full"
              >
                Back Home
              </button>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPayment;