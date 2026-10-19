import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { toast } from "react-toastify";

import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const CartContext = createContext();
const getListingType = (product) => {
  if (product?.listingType) {
    return product.listingType;
  }

  const lendingAvailable =
    product?.isLendingAvailable ??
    (Number(product?.priceLending) > 0);

  return lendingAvailable
    ? "sale_and_rental"
    : "sale";
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] =
    useState(false);

  const [isProductModalOpen, setIsProductModalOpen] =
    useState(false);

  const [currentProduct, setCurrentProduct] =
    useState(null);

  /* --------------------------------
     LOAD CART
  -------------------------------- */

  useEffect(() => {
    const savedCart =
      localStorage.getItem("cart");

    if (!savedCart) return;

    try {
      const parsedCart =
        JSON.parse(savedCart);

      /*
        Нормалізуємо старі записи,
        щоб після оновлення коду
        старі collection items також
        нормально відображались.
      */

      const normalizedCart =
        parsedCart.map((item) => {

          /* --------------------------------
             COLLECTION
          -------------------------------- */

          if (item.type === "collection") {
            const collection =
              item.collection || item;

            const books =
              item.books ||
              collection.books ||
              [];

            const firstBook =
              books[0] || null;

            const collectionId =
              item.collectionId ||
              collection.id ||
              item.id?.replace(
                "collection-",
                ""
              ) ||
              null;

            const name =
              item.name ||
              item.collectionName ||
              collection.collectionName ||
              collection.name ||
              collection.title ||
              "Book Collection";

            const image =
              item.image ||
              item.images?.[0] ||
              item.imageUrl ||
              item.coverUrl ||
              collection.image ||
              collection.images?.[0] ||
              collection.imageUrl ||
              collection.coverUrl ||
              firstBook?.image ||
              firstBook?.images?.[0] ||
              firstBook?.imageUrl ||
              firstBook?.coverUrl ||
              "";

            return {
              ...item,

              id:
                item.id ||
                `collection-${collectionId}`,

              collectionId,

              name,
              collectionName: name,

              image,

              books,

              collection: {
                ...collection,
                id: collectionId,
                collectionName: name,
                books,
              },

              price: Number(
                item.price ??
                collection.price ??
                0
              ),

              priceLending: 0,

              purchaseType: "full",

              quantity:
                item.quantity || 1,

              bookCount:
                item.bookCount ||
                collection.bookCount ||
                books.length ||
                0,
            };
          }

          /* --------------------------------
             BOOK
          -------------------------------- */

        if (item.type === "book") {
  const listingType = getListingType(item);

  return {
    ...item,

    listingType,

    price:
      listingType === "rental_only"
        ? null
        : Number(item.price ?? 0),

    isLendingAvailable:
  listingType !== "sale",

    priceLending:
      listingType !== "sale"
        ? Number(item.priceLending ?? 0)
        : 0,

    unit:
      listingType !== "sale"
        ? item.unit || null
        : null,

purchaseType:
  item.purchaseType ||
  (listingType === "rental_only" ? "rental" : "full"),

    pages:
      item.pages != null
        ? Number(item.pages)
        : null,

    language:
      item.language || null,

    condition:
      item.condition || null,
  };
}

          /* --------------------------------
             COMIC
          -------------------------------- */

          if (item.type === "comic") {
            const listingType = getListingType(item);
            return {
              ...item,

              id:
                item.id ||
                item.comicId,

              comicId:
                item.comicId ||
                item.id,

              name:
                item.name ||
                "Untitled Comic",

              author:
                item.author || "",

              artist:
                item.artist || "",

              publisher:
                item.publisher || "",

              issue:
                item.issue || "",

              volume:
                item.volume || "",

              year:
                item.year != null
                  ? Number(item.year)
                  : null,

              genre:
                item.genre || "",

              pages:
                item.pages != null
                  ? Number(item.pages)
                  : null,

              language:
                item.language || null,

              condition:
                item.condition || null,

              description:
                item.description || "",

              images:
                Array.isArray(item.images)
                  ? item.images.filter(Boolean)
                  : [],

              image:
                item.image ||
                item.images?.[0] ||
                "",

              listingType,

price:
  listingType === "rental_only"
    ? null
    : Number(item.price ?? 0),

          isLendingAvailable:
  listingType !== "sale",

              priceLending:
                item.priceLending != null
                  ? Number(item.priceLending)
                  : 0,

              unit:
                item.unit || null,

purchaseType:
  item.purchaseType ||
  (listingType === "rental_only" ? "rental" : "full"),

           finalPrice:
  listingType === "rental_only"
    ? Number(item.priceLending || 0)
    : item.finalPrice != null
      ? Number(item.finalPrice)
      : item.purchaseType === "rental"
        ? Number(item.priceLending || 0)
        : Number(item.price || 0),

              quantity: 1,

              sellerId:
                item.sellerId || null,

              sellerName:
                item.sellerName || null,

              sellerPhoto:
                item.sellerPhoto || null,

              tradeId:
                item.tradeId ?? null,

              isTrade:
                item.isTrade === true,
            };
          }

          if (item.type === "boardGame") {
  const listingType = getListingType(item);

  const boardGameId = item.boardGameId || item.id;

  const purchaseType =
    listingType === "rental_only"
      ? "rental"
      : item.purchaseType || "full";

  const price =
    listingType === "rental_only"
      ? null
      : Number(item.price ?? 0);

  const priceLending =
    listingType === "sale"
      ? 0
      : Number(item.priceLending ?? 0);

  return {
    ...item,
    id: boardGameId,
    boardGameId,
    type: "boardGame",
    name: item.name || "Board Game",
    images: Array.isArray(item.images)
      ? item.images.filter(Boolean)
      : [],
    image: item.image || item.images?.[0] || "",
    listingType,
    purchaseType,
    price,
    priceLending,
    isLendingAvailable: listingType !== "sale",
finalPrice:
  item.isTrade === true || Boolean(item.tradeId)
    ? Number(item.finalPrice ?? item.price ?? 0)
    : purchaseType === "rental"
    ? priceLending
    : price,

isTrade: item.isTrade === true || Boolean(item.tradeId),
tradeId: item.tradeId || null,
    quantity: 1,
  };
}

          return item;
        });

      setCart(normalizedCart);

      /*
        Якщо старі дані були виправлені,
        одразу зберігаємо нормальну версію.
      */

      localStorage.setItem(
        "cart",
        JSON.stringify(normalizedCart),
      );
    } catch (error) {
      console.error(
        "Error loading cart:",
        error,
      );

      localStorage.removeItem("cart");
    }
  }, []);

  /* --------------------------------
     SAVE CART
  -------------------------------- */

  const saveCart = (newCart) => {
    localStorage.setItem(
      "cart",
      JSON.stringify(newCart),
    );

    setCart(newCart);
  };

  /* --------------------------------
     GET COLLECTION IMAGE
  -------------------------------- */

  const getCollectionImage = (product) => {
    const collection =
      product.collection || product;

    const firstBook =
      collection?.books?.[0] ||
      product?.books?.[0] ||
      null;

    return (
      product?.image ||
      product?.images?.[0] ||
      product?.imageUrl ||
      product?.coverUrl ||
      collection?.image ||
      collection?.images?.[0] ||
      collection?.imageUrl ||
      collection?.coverUrl ||
      firstBook?.image ||
      firstBook?.images?.[0] ||
      firstBook?.imageUrl ||
      firstBook?.coverUrl ||
      ""
    );
  };

  /* --------------------------------
     GET PRODUCT NAME
  -------------------------------- */

  const getProductName = (
    product,
    type,
  ) => {
    if (type === "collection") {
      const collectionId =
        product.collectionId ||
        product.collection?.id ||
        product.id;

      if (!collectionId) {
        toast.error(
          "Collection ID is missing"
        );
        return;
      }

      const cartId =
        `collection-${collectionId}`;

      const exists = cart.find(
        (item) =>
          item.type === "collection" &&
          (
            item.collectionId ===
              collectionId ||
            item.id === cartId
          )
      );

      if (exists) {
        toast.error(
          "Collection already in cart"
        );
        return;
      }

      /*
        --------------------------------
        COLLECTION DATA
        --------------------------------
      */

      const source =
        product.collection || product;

      const books = Array.isArray(
        product.books ||
        source.books
      )
        ? (
            product.books ||
            source.books
          ).map((book) => ({
            id:
              book?.id ?? null,

            name:
              book?.name ?? "",

            title:
              book?.title ?? "",

            author:
              book?.author ?? "",

            year:
              book?.year != null
                ? Number(book.year)
                : null,

            pages:
              book?.pages != null
                ? Number(book.pages)
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
              book?.image ||
              book?.images?.[0] ||
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
                book?.price ?? 0
              ),
          }))
        : [];

      const collectionName =
        product.collectionName ||
        product.name ||
        source.collectionName ||
        source.name ||
        source.title ||
        "Book Collection";

      const firstBook =
        books[0] || null;

      const collectionImage =
        product.image ||
        product.images?.[0] ||
        source.image ||
        source.images?.[0] ||
        firstBook?.image ||
        firstBook?.images?.[0] ||
        "";

      const collectionPrice =
        Number(
          product.price ??
            source.price ??
            0
        );

      const bookCount =
        Number(
          product.bookCount ??
            source.bookCount ??
            books.length ??
            0
        );

      /*
        --------------------------------
        TRADE DATA
        --------------------------------
      */

      const finalPrice =
        product.finalPrice !==
          undefined &&
        product.finalPrice !== null
          ? Number(
              product.finalPrice
            )
          : null;

      const tradeId =
        product.tradeId ?? null;

      const isTrade =
        product.isTrade === true;

      /*
        --------------------------------
        CLEAN COLLECTION
        --------------------------------
      */

      const cleanCollection = {
        id: collectionId,

        collectionName,

        books,

        bookCount,

        price: collectionPrice,

        image: collectionImage,

        sellerId:
          product.sellerId ??
          source.sellerId ??
          null,

        sellerName:
          product.sellerName ??
          source.sellerName ??
          "",
      };

      /*
        --------------------------------
        CART ITEM
        --------------------------------
      */

      const newItem = {
        id: cartId,

        collectionId,

        type: "collection",

        name: collectionName,

        collectionName,

        image: collectionImage,

        books,

        bookCount,

        collection:
          cleanCollection,

        quantity: 1,

        price:
          collectionPrice,

        priceLending: 0,

        finalPrice,

        tradeId,

        isTrade,

        purchaseType: "full",

        sellerId:
          product.sellerId ??
          source.sellerId ??
          null,

        sellerName:
          product.sellerName ??
          source.sellerName ??
          "",

        sellerPhoto:
          product.sellerPhoto ??
          source.sellerPhoto ??
          null,
      };

      saveCart([
        ...cart,
        newItem,
      ]);

      toast.success(
        isTrade
          ? "Trade collection added to cart"
          : "Collection added to cart"
      );

      return;
    }

    return (
      product.name ||
      product.title ||
      "Item"
    );
  };

  /* --------------------------------
     ADD TO CART
  -------------------------------- */

  
const addToCart = async (product) => {
  const type = product.type || "book";

  // Перевіряємо актуальний статус книги або комікса
  // безпосередньо у Firestore.
  if (
    (type === "book" ||
  type === "comic" ||
  type === "boardGame") &&
    product.isTrade !== true &&
    !product.tradeId
  ) {
    try {
      const productId =
  type === "comic"
    ? product.comicId || product.id
    : type === "boardGame"
    ? product.boardGameId || product.id
    : product.bookId || product.id;

      if (!productId) {
        toast.error("Product ID is missing.");
        return;
      }

     const productRef = doc(
  db,
  type === "comic"
    ? "comics"
    : type === "boardGame"
    ? "boardGames"
    : "books",
  productId
);

      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        toast.error("This product is no longer available.");
        return;
      }

     const liveProduct = productSnap.data();

if (
  liveProduct.isCurrentlyRented === true ||
  liveProduct.activeRentalOrderId
) {
  toast.error("This product is currently rented.");
  return;
}
    } catch (error) {
      console.error("Could not verify product availability:", error);
      toast.error("Could not verify product availability. Please try again.");
      return;
    }
  }
    /*
      --------------------------------
      COLLECTION
      --------------------------------
    */

    if (type === "collection") {
      const collectionId =
        product.collectionId ||
        product.collection?.id ||
        product.id;

      if (!collectionId) {
        toast.error(
          "Collection ID is missing"
        );
        return;
      }

      const cartId =
        `collection-${collectionId}`;

      const exists = cart.find(
        (item) =>
          item.type === "collection" &&
          (
            item.collectionId ===
              collectionId ||
            item.id === cartId
          )
      );

      if (exists) {
        toast.error(
          "Collection already in cart"
        );
        return;
      }

      /*
        Завжди беремо реальний
        об'єкт колекції.
      */

      const collectionData =
        product.collection || product;

      /*
        Книги колекції.
      */

      const sourceBooks =
        product.books ||
        collectionData.books ||
        [];

      const books = Array.isArray(
        sourceBooks
      )
        ? sourceBooks.map(
            (book) => ({
              id:
                book?.id ?? null,

              name:
                book?.name ?? "",

              title:
                book?.title ?? "",

              author:
                book?.author ?? "",

              year:
                book?.year != null
                  ? Number(book.year)
                  : null,

              pages:
                book?.pages != null
                  ? Number(book.pages)
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
                book?.image ||
                book?.images?.[0] ||
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
                  book?.price ?? 0
                ),
            })
          )
        : [];

      /*
        Назва колекції.
      */

      const collectionName =
        product.collectionName ||
        product.name ||
        collectionData.collectionName ||
        collectionData.name ||
        collectionData.title ||
        "Book Collection";

      /*
        Перша обкладинка.
      */

      const firstBook =
        books[0] || null;

      const collectionImage =
        product.image ||
        product.images?.[0] ||
        product.imageUrl ||
        product.coverUrl ||
        collectionData.image ||
        collectionData.images?.[0] ||
        collectionData.imageUrl ||
        collectionData.coverUrl ||
        firstBook?.image ||
        firstBook?.images?.[0] ||
        firstBook?.imageUrl ||
        firstBook?.coverUrl ||
        "";

      /*
        Ціна.
      */

      const collectionPrice =
        Number(
          product.price ??
            collectionData.price ??
            0
        );

      const newItem = {
        /*
          Cart ID
        */

        id: cartId,

        /*
          Реальний ID колекції
        */

        collectionId,

        /*
          Головні дані
        */

        type: "collection",

        name: collectionName,

        collectionName:
          collectionName,

        image:
          collectionImage,

        /*
          Книги
        */

        books,

        bookCount:
          product.bookCount ||
          collectionData.bookCount ||
          books.length ||
          0,

        /*
          Повний об'єкт
        */

        collection: {
          ...collectionData,

          id: collectionId,

          collectionName,

          books,

          bookCount:
            product.bookCount ||
            collectionData.bookCount ||
            books.length ||
            0,
        },

        quantity: 1,

        price:
          collectionPrice,

        priceLending: 0,

      
finalPrice:
  product.finalPrice != null
    ? Number(product.finalPrice)
    : null,

tradeId:
  product.tradeId ?? null,

isTrade:
  product.isTrade === true,


        /*
          Колекції тільки
          купуються.
        */

        purchaseType:
          "full",

        sellerId:
          product.sellerId ||
          collectionData.sellerId ||
          null,

        sellerName:
          product.sellerName ||
          collectionData.sellerName ||
          null,

        sellerPhoto:
          product.sellerPhoto ||
          collectionData.sellerPhoto ||
          null,
      };

      saveCart([
        ...cart,
        newItem,
      ]);

      toast.success(
        "Collection added to cart"
      );

      return;
    }

    /*
      --------------------------------
      board games
      --------------------------------
    */

      if (type === "boardGame") {
  const boardGameId = product.boardGameId || product.id;

  if (!boardGameId) {
    toast.error("Board game ID is missing");
    return;
  }

  const exists = cart.some(
    (item) =>
      item.type === "boardGame" &&
      (item.boardGameId === boardGameId ||
        item.id === boardGameId)
  );

  if (exists) {
    toast.error("Board game already in cart");
    return;
  }

  const listingType = getListingType(product);
  const isRentalOnly = listingType === "rental_only";
  const isLendingAvailable = listingType !== "sale";

  const purchaseType = isRentalOnly
    ? "rental"
    : product.purchaseType || "full";

  const price =
    isRentalOnly ? null : Number(product.price ?? 0);

  const priceLending = Number(product.priceLending ?? 0);

  if (
    purchaseType === "rental" &&
    (!isLendingAvailable || priceLending <= 0)
  ) {
    toast.error("Lending is not available for this game");
    return;
  }

  if (isRentalOnly && purchaseType !== "rental") {
    toast.error("This game is available for rental only");
    return;
  }

  if (
    purchaseType === "full" &&
    (!Number.isFinite(price) || price < 0)
  ) {
    toast.error("Invalid sale price");
    return;
  }

  const newItem = {
    ...product,
    id: boardGameId,
    boardGameId,
    type: "boardGame",
    name: product.name || "Board Game",
    image: product.images?.[0] || product.image || "",
    images: product.images || [],
    listingType,
    purchaseType,
    price,
    priceLending,
    isLendingAvailable,
    unit: product.unit || null,
finalPrice:
  product.isTrade === true || Boolean(product.tradeId)
    ? Number(product.finalPrice ?? product.price ?? 0)
    : purchaseType === "rental"
    ? priceLending
    : price,

isTrade:
  product.isTrade === true || Boolean(product.tradeId),

tradeId: product.tradeId || null,
    quantity: 1,
  };

  saveCart([...cart, newItem]);
  toast.success("Added to cart");
  return;
}
    /*
      --------------------------------
      COMIC
      --------------------------------
    */

    if (type === "comic") {
      const comicId =
        product.comicId ||
        product.id;

      if (!comicId) {
        toast.error(
          "Comic ID is missing"
        );
        return;
      }

      /*
        Комікс не можна додати
        повторно в кошик.
      */

      const exists = cart.find(
        (item) =>
          item.type === "comic" &&
          (
            item.comicId === comicId ||
            item.id === comicId
          )
      );

      if (exists) {
        toast.error(
          "Comic already in cart"
        );
        return;
      }

     const listingType = getListingType(product);

const isRentalOnly =
  listingType === "rental_only";

const price =
  isRentalOnly
    ? null
    : Number(product.price ?? 0);

const priceLending =
  product.priceLending != null
    ? Number(product.priceLending)
    : 0;

const isLendingAvailable =
  listingType !== "sale";

const purchaseType =
  isRentalOnly
    ? "rental"
    : product.purchaseType || "full";

if (
  purchaseType === "rental" &&
  (
    !isLendingAvailable ||
    priceLending <= 0
  )
) {
  toast.error(
    "Lending is not available or the lending price is invalid."
  );
  return;
}

const finalPrice =
  purchaseType === "rental"
    ? priceLending
    : product.finalPrice != null
      ? Number(product.finalPrice)
      : price;

      const newItem = {
        /*
          Основний ID коміксу
        */

        id: comicId,

        comicId,

        type: "comic",

        /*
          Основна інформація
        */

        name:
          product.name ||
          "Untitled Comic",

        author:
          product.author || "",

        artist:
          product.artist || "",

        publisher:
          product.publisher || "",

        issue:
          product.issue || "",

        volume:
          product.volume || "",

        year:
          product.year != null
            ? Number(
                product.year
              )
            : null,

        genre:
          product.genre || "",

        pages:
          product.pages != null
            ? Number(
                product.pages
              )
            : null,

        language:
          product.language || null,

        condition:
          product.condition || null,

        description:
          product.description || "",

        /*
          Зображення
        */

        images:
          Array.isArray(
            product.images
          )
            ? product.images.filter(
                Boolean
              )
            : [],

        image:
          product.image ||
          product.images?.[0] ||
          "",

        /*
          Ціна
        */

          listingType,

        price,

        isLendingAvailable:
          Boolean(
            isLendingAvailable
          ),

        priceLending,

        unit:
          product.unit || null,

        purchaseType,

        finalPrice,

        /*
          Як і книги —
          кількість завжди 1.
        */

        quantity: 1,

        /*
          Продавець
        */

        sellerId:
          product.sellerId ||
          null,

        sellerName:
          product.sellerName ||
          null,

        sellerPhoto:
          product.sellerPhoto ||
          null,

        /*
          Trade
        */

        tradeId:
          product.tradeId ??
          null,

        isTrade:
          product.isTrade === true,
      };

      saveCart([
        ...cart,
        newItem,
      ]);

      toast.success(
        purchaseType === "rental"
          ? "Comic added to cart for lending"
          : "Comic added to cart"
      );

      return;
    }

    /*
      --------------------------------
      BOOK / SHOP
      --------------------------------
    */
   const listingType =
  type === "book"
    ? getListingType(product)
    : null;

const isRentalOnly =
  listingType === "rental_only";

const isLendingAvailable =
  type === "book"
    ? listingType !== "sale"
    : (
        product.isLendingAvailable ??
        Number(product.priceLending) > 0
      );

const purchaseType =
  isRentalOnly
    ? "rental"
    : product.purchaseType || "full";

const price =
  isRentalOnly
    ? null
    : Number(product.price ?? 0);

const priceLending =
  isLendingAvailable
    ? Number(product.priceLending || 0)
    : 0;

if (
  type === "book" &&
  purchaseType === "rental" &&
  priceLending <= 0
) {
  toast.error(
    "Lending is not available or the lending price is invalid."
  );
  return;
}

    const exists = cart.find(
  (item) =>
    item.id === product.id &&
    (
      type === "book"
        ? item.type === "book"
        : item.type === type
    )
);

    if (exists) {
      toast.error(
        "Item already in cart",
      );

      return;
    }

    const newItem = {
      id: product.id,

      name:
        getProductName(
          product,
          type,
        ),

      type,

      quantity:
        product.quantity || 1,

      price,

      pages:
        type === "book"
          ? (
              product.pages != null
                ? Number(product.pages)
                : null
            )
          : null,

      language:
        type === "book"
          ? product.language || null
          : null,

      condition:
        type === "book"
          ? product.condition || null
          : null,

   listingType:
  type === "book"
    ? listingType
    : undefined,

isLendingAvailable,

priceLending,

unit:
  isLendingAvailable
    ? product.unit || null
    : null,

      finalPrice:
        product.finalPrice != null
          ? Number(
              product.finalPrice
            )
          : null,

      tradeId:
        product.tradeId ?? null,

      isTrade:
        product.isTrade === true,

      /*
        BOOK:
        images[0] OR image

        SHOP:
        image OR images[0]
      */

      image:
        type === "book"
          ? (
              product.images?.[0] ||
              product.image ||
              ""
            )
          : (
              product.image ||
              product.images?.[0] ||
              ""
            ),

     purchaseType,

      sellerId:
        product.sellerId ||
        null,

      sellerName:
        product.sellerName ||
        null,

      sellerPhoto:
        product.sellerPhoto ||
        null,
    };

    saveCart([
      ...cart,
      newItem,
    ]);

    toast.success(
      "Added to cart",
    );
  };

  /* --------------------------------
     REMOVE
  -------------------------------- */

  const removeFromCart = (id) => {
    saveCart(
      cart.filter(
        (item) =>
          item.id !== id,
      ),
    );
  };

  /* --------------------------------
     UPDATE QUANTITY
  -------------------------------- */

  const updateQuantity = (
    id,
    quantity,
  ) => {
    const item = cart.find(
      (item) => item.id === id,
    );

    /*
      Books, comics and collections
      cannot have quantity changed.
    */

    if (
      !item ||
      item.type === "book" ||
      item.type === "comic" ||
      item.type === "boardGame" ||
      item.type === "collection" ||
      quantity < 1
    ) {
      return;
    }

    const updated = cart.map(
      (item) =>
        item.id === id
          ? {
              ...item,
              quantity,
            }
          : item,
    );

    saveCart(updated);
  };

  /* --------------------------------
     UPDATE PURCHASE TYPE
  -------------------------------- */

  const updatePurchaseType = (
    id,
    type,
  ) => {
    const item = cart.find(
      (item) => item.id === id,
    );

    if (!item) return;
    if (type !== "full" && type !== "rental") {
  toast.error("Invalid purchase type.");
  return;
}

if (
  item.type !== "book" &&
  item.type !== "comic" &&
  item.type !== "boardGame"
) {
  return;
}

if (
  (item.isTrade === true || item.tradeId) &&
  type === "rental"
) {
  toast.error("Trade items cannot be rented.");
  return;
}

    /*
      Collections can only be purchased.
    */

    if (
      item.type === "collection"
    ) {
      return;
    }

const listingType = getListingType(item);

const isRentalOnly =
  listingType === "rental_only";

const isLendingAvailable =
  listingType !== "sale";

if (
  isRentalOnly &&
  type !== "rental"
) {
  toast.error(
    "This item is available for rental only."
  );
  return;
}

    /*
      Prevent rental for items
      that do not support lending.
    */

    if (
      type === "rental" &&
      !isLendingAvailable
    ) {
      toast.error(
        "Lending is not available for this item"
      );

      return;
    }

    const updated = cart.map(
      (item) =>
        item.id === id
          ? {
              ...item,
              purchaseType: type,


finalPrice: item.isTrade
  ? Number(item.finalPrice ?? item.price ?? 0)
  : (
      isRentalOnly || type === "rental"
    )
      ? Number(item.priceLending || 0)
      : Number(item.price || 0),
            }
          : item,
    );

    saveCart(updated);
  };

  /* --------------------------------
     CLEAR CART
  -------------------------------- */

  const clearCart = () => {
    setCart([]);

    localStorage.removeItem(
      "cart",
    );
  };

  /* --------------------------------
     CART COUNT
  -------------------------------- */

  const cartCount =
    cart.length;

  /* --------------------------------
     PRODUCT MODAL
  -------------------------------- */

  const openProductModal = (
    product,
  ) => {
    setCurrentProduct(product);

    setIsProductModalOpen(true);
  };

  return (
    <CartContext.Provider
      value={{
        cart,

        cartCount,

        addToCart,

        removeFromCart,

        updateQuantity,

        updatePurchaseType,

        clearCart,

        isCartOpen,

        setIsCartOpen,

        isProductModalOpen,

        setIsProductModalOpen,

        currentProduct,

        openProductModal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () =>
  useContext(CartContext);