
// import {
//   doc,
//   runTransaction,
//   increment,
// } from "firebase/firestore";

// import { db } from "../../firebase";

// export const completeRentalOrder = async (orderId, sellerId) => {
//   if (!orderId || !sellerId) {
//     throw new Error("Order ID or seller ID is missing.");
//   }

//   const orderRef = doc(db, "orders", orderId);

//   return runTransaction(db, async (transaction) => {
//     const orderSnap = await transaction.get(orderRef);

//     if (!orderSnap.exists()) {
//       throw new Error("Order not found.");
//     }

//     const order = orderSnap.data();

//     // Prevent duplicate rental counting
//     if (order.rentalCounted === true) {
//       return { alreadyCounted: true };
//     }

//     // Exclude trades and collections
//     if (
//       order.isTrade === true ||
//       order.tradeId ||
//       order.tradeCompleted === true ||
//       order.type === "collection"
//     ) {
//       throw new Error(
//         "This order cannot be completed as a rental."
//       );
//     }

//     if (order.status !== "accepted") {
//       throw new Error(
//         "Only accepted orders can have their rentals completed."
//       );
//     }

//     // Support existing and newer order structures
//     const items = [
//       ...(Array.isArray(order.items) ? order.items : []),
//       ...(Array.isArray(order.bookItems) ? order.bookItems : []),
//       ...(Array.isArray(order.comicItems) ? order.comicItems : []),
//     ];

//     const rentalItems = items.filter(
//       (item) =>
//         item.purchaseType === "rental" &&
//         item.isTrade !== true &&
//         !item.tradeId
//     );

//     if (rentalItems.length === 0) {
//       throw new Error("No rental items found in this order.");
//     }

//     // Seller must own all rental items in this order
//     const isSeller =
//       order.sellerId === sellerId ||
//       (Array.isArray(order.sellerIds) &&
//         order.sellerIds.includes(sellerId));

//     if (!isSeller) {
//       throw new Error(
//         "Only the seller can confirm the rental return."
//       );
//     }

//     const productMap = new Map();

//     rentalItems.forEach((item) => {
//       const isComic =
//         item.type === "comic" ||
//         order.type === "comic";

//       const productId = isComic
//         ? item.comicId || item.id
//         : item.bookId || item.id;

//       if (!productId) {
//         throw new Error("Rental product ID is missing.");
//       }

//       const collectionName = isComic ? "comics" : "books";
//       const key = `${collectionName}:${productId}`;

//       if (!productMap.has(key)) {
//         productMap.set(key, {
//           ref: doc(db, collectionName, productId),
//           productId,
//         });
//       }
//     });

//     const products = [...productMap.values()];

//     // All reads must happen before writes
//     const productSnaps = await Promise.all(
//       products.map(({ ref }) => transaction.get(ref))
//     );

//     productSnaps.forEach((snap, index) => {
//       if (!snap.exists()) {
//         throw new Error(
//           `Rental product ${products[index].productId} not found.`
//         );
//       }

//       const productData = snap.data();

//       if (
//         productData.activeRentalOrderId &&
//         productData.activeRentalOrderId !== orderId
//       ) {
//         throw new Error(
//           "This product belongs to another active rental."
//         );
//       }
//     });

//     products.forEach(({ ref }) => {
//       transaction.update(ref, {
//         isCurrentlyRented: false,
//         activeRentalOrderId: null,
//         successfulRentals: increment(1),
//       });
//     });

//     transaction.update(orderRef, {
//       status: "completed",
//       rentalCounted: true,
//     });

//     return { alreadyCounted: false };
//   });
// };


import {
  doc,
  runTransaction,
  increment,
} from "firebase/firestore";

import { db } from "../../firebase";

export const completeRentalOrder = async (orderId, sellerId) => {
  if (!orderId || !sellerId) {
    throw new Error("Order ID or seller ID is missing.");
  }

  const orderRef = doc(db, "orders", orderId);

  return runTransaction(db, async (transaction) => {
    const orderSnap = await transaction.get(orderRef);

    if (!orderSnap.exists()) {
      throw new Error("Order not found.");
    }

    const order = orderSnap.data();

    if (order.rentalCounted === true) {
      return { alreadyCounted: true };
    }

    if (
      order.isTrade === true ||
      order.tradeId ||
      order.tradeCompleted === true ||
      order.type === "collection"
    ) {
      throw new Error(
        "This order cannot be completed as a rental."
      );
    }

    if (order.status !== "accepted") {
      throw new Error(
        "Only accepted orders can have their rentals completed."
      );
    }

    const allItems = [
      ...(Array.isArray(order.items) ? order.items : []),
      ...(Array.isArray(order.bookItems) ? order.bookItems : []),
      ...(Array.isArray(order.comicItems) ? order.comicItems : []),
      ...(Array.isArray(order.boardGameItems)
        ? order.boardGameItems
        : []),
    ];

    const rentalItems = allItems.filter(
      (item) =>
        item.purchaseType === "rental" &&
        item.isTrade !== true &&
        !item.tradeId
    );

    if (rentalItems.length === 0) {
      throw new Error("No rental items found in this order.");
    }

    const isSeller =
      order.sellerId === sellerId ||
      (Array.isArray(order.sellerIds) &&
        order.sellerIds.includes(sellerId));

    if (!isSeller) {
      throw new Error(
        "Only the seller can confirm the rental return."
      );
    }

    const productMap = new Map();

    rentalItems.forEach((item) => {
      const type = item.type || order.type;

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
        throw new Error("Unsupported rental product type.");
      }

      if (!productId) {
        throw new Error("Rental product ID is missing.");
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

    const productSnaps = await Promise.all(
      products.map(({ ref }) => transaction.get(ref))
    );

    productSnaps.forEach((snap, index) => {
      if (!snap.exists()) {
        throw new Error(
          `Rental product ${products[index].productId} not found.`
        );
      }

      const productData = snap.data();

      if (
        productData.activeRentalOrderId &&
        productData.activeRentalOrderId !== orderId
      ) {
        throw new Error(
          "This product belongs to another active rental."
        );
      }
    });

    products.forEach(({ ref }) => {
      transaction.update(ref, {
        isCurrentlyRented: false,
        activeRentalOrderId: null,
        successfulRentals: increment(1),
      });
    });

    transaction.update(orderRef, {
      status: "completed",
      rentalCounted: true,
    });

    return { alreadyCounted: false };
  });
};
