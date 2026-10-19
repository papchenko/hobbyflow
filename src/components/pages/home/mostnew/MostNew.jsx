import { useEffect, useState } from "react";

import ProductCard from "../../../cart/ProductCard";
import ProductModal from "../../../cart/ProductModal";

import ProductCollectionCard from "../../../cart/ProductCollectionCard";
import ProductCollectionModal from "../../../cart/ProductCollectionModal";

import ProductComicCard from "../../../cart/ProductComicCard";
import ProductComicModal from "../../../cart/ProductComicModal";

import BoardGameCard from "../../../cart/BoardGameCard";
import BoardGameModal from "../../../cart/BoardGameModal";

import { db } from "../../../../firebase";

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

const MostNew = () => {
  const [latestItems, setLatestItems] = useState([]);

  const [itemsToShow, setItemsToShow] = useState(8);

  const [selectedBook, setSelectedBook] = useState(null);

  const [selectedCollection, setSelectedCollection] = useState(null);

  const [selectedComic, setSelectedComic] = useState(null);

  const [selectedBoardGame, setSelectedBoardGame] = useState(null);

  const [sellers, setSellers] = useState({});

  useEffect(() => {
    const fetchLatestItems = async () => {
      try {
        // -----------------------------
        // LATEST BOOKS
        // -----------------------------

        const booksQuery = query(
          collection(db, "books"),
          orderBy("createdAt", "desc"),
          limit(5),
        );

        // -----------------------------
        // LATEST COLLECTIONS
        // -----------------------------

        const collectionsQuery = query(
          collection(db, "bookCollections"),
          orderBy("createdAt", "desc"),
          limit(5),
        );

        // -----------------------------
        // LATEST COMICS
        // -----------------------------

        const comicsQuery = query(
          collection(db, "comics"),
          orderBy("createdAt", "desc"),
          limit(5),
        );

        // -----------------------------
        // LATEST BOARD GAMES
        // -----------------------------

        const boardGamesQuery = query(
          collection(db, "boardGames"),
          orderBy("createdAt", "desc"),
          limit(5),
        );

        // const [
        //   booksSnap,
        //   collectionsSnap,
        //   comicsSnap,
        //   boardGamesSnap,
        // ] = await Promise.all([
        //   getDocs(booksQuery),
        //   getDocs(collectionsQuery),
        //   getDocs(comicsQuery),
        //   getDocs(boardGamesQuery),
        // ]);
        const results = await Promise.allSettled([
  getDocs(booksQuery),
  getDocs(collectionsQuery),
  getDocs(comicsQuery),
  getDocs(boardGamesQuery),
]);

const labels = [
  "books",
  "bookCollections",
  "comics",
  "boardGames",
];

results.forEach((result, index) => {
  if (result.status === "rejected") {
    console.error(
      `Failed to load ${labels[index]}:`,
      result.reason
    );
  }
});

const emptySnapshot = { docs: [] };

const [
  booksSnap,
  collectionsSnap,
  comicsSnap,
  boardGamesSnap,
] = results.map((result) =>
  result.status === "fulfilled"
    ? result.value
    : emptySnapshot
);

        // -----------------------------
        // BOARD GAMES
        // -----------------------------

        const boardGames = boardGamesSnap.docs.map((gameDoc) => ({
          ...gameDoc.data(),
          id: gameDoc.id,
          type: "boardGame",
        }));

        // -----------------------------
        // BOOKS
        // -----------------------------

        const books = booksSnap.docs.map((bookDoc) => ({
          id: bookDoc.id,
          ...bookDoc.data(),
          type: "book",
        }));

        // -----------------------------
        // COLLECTIONS
        // -----------------------------

        const collections = collectionsSnap.docs.map(
          (collectionDoc) => ({
            id: collectionDoc.id,
            ...collectionDoc.data(),
            type: "collection",
          }),
        );

        // -----------------------------
        // COMICS
        // -----------------------------

        const comics = comicsSnap.docs.map((comicDoc) => ({
          id: comicDoc.id,
          ...comicDoc.data(),
          type: "comic",
        }));

        // -----------------------------
        // MERGE + SORT BY createdAt
        // -----------------------------

       const mergedItems = [
        ...books,
        ...collections,
        ...comics,
        ...boardGames,
      ].sort((a, b) => {
          const aTime =
            a.createdAt?.toMillis?.() ?? 0;

          const bTime =
            b.createdAt?.toMillis?.() ?? 0;

          return bTime - aTime;
        });

        setLatestItems(mergedItems);

        // -----------------------------
        // LOAD SELLERS
        // -----------------------------

        const sellerIds = [
          ...new Set(
            mergedItems
              .map((item) => item.sellerId)
              .filter(Boolean),
          ),
        ];

        const sellersData = {};

        await Promise.all(
          sellerIds.map(async (sellerId) => {
            const sellerSnap = await getDoc(
              doc(db, "users", sellerId),
            );

            if (sellerSnap.exists()) {
              const data = sellerSnap.data();

              sellersData[sellerId] = {
                name: data.name || "Unknown",

                photoURL:
                  data.photoURL || null,

                lastSeen:
                  data.lastSeen || null,

                sellerStats:
                  data.sellerStats || {
                    completedOrders: 0,
                    ratingAverage: 0,
                    ratingCount: 0,
                  },
              };
            }
          }),
        );

        setSellers(sellersData);
      } catch (error) {
        console.error(
          "Error fetching latest items:",
          error,
        );
      }
    };

    fetchLatestItems();
  }, []);

  // -----------------------------
  // RESPONSIVE COUNT
  // -----------------------------

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsToShow(4);
      } else {
        setItemsToShow(8);
      }
    };

    handleResize();

    window.addEventListener(
      "resize",
      handleResize,
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
  }, []);

  return (
    <>
      <section className="py-12 dark:bg-gray-800">
        <div className="container mx-auto px-4">

          <h2
            className="
              text-3xl
              font-bold
              text-center
              mb-12
              text-gray-800
              dark:text-white
            "
          >
            Most New
          </h2>

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              md:grid-cols-3
              lg:grid-cols-4
              gap-6
            "
          >
            {latestItems
              .slice(0, itemsToShow)
              .map((item) => {

                // -----------------------------
                // BOOK
                // -----------------------------

                if (item.type === "book") {
                  return (
                    <div
                      key={`book-${item.id}`}
                      className="w-full min-w-0"
                    >
                      <ProductCard
                        product={item}
                        onClick={() =>
                          setSelectedBook(item)
                        }
                      />
                    </div>
                  );
                }

                // -----------------------------
                // COLLECTION
                // -----------------------------

                if (
                  item.type === "collection"
                ) {
                  return (
                    <div
                      key={`collection-${item.id}`}
                      className="w-full min-w-0"
                    >
                      <ProductCollectionCard
                        collection={item}
                        seller={
                          sellers[item.sellerId]
                        }
                        onClick={() =>
                          setSelectedCollection(
                            item,
                          )
                        }
                      />
                    </div>
                  );
                }

                // -----------------------------
                // COMIC
                // -----------------------------

                if (item.type === "comic") {
                  return (
                    <div
                      key={`comic-${item.id}`}
                      className="w-full min-w-0"
                    >
                      <ProductComicCard
                        comic={item}
                        seller={
                          sellers[item.sellerId]
                        }
                        onClick={() =>
                          setSelectedComic(item)
                        }
                      />
                    </div>
                  );
                }

                // -----------------------------
                // BOARD GAME
                // -----------------------------

                if (item.type === "boardGame") {
                  return (
                    <div
                      key={`boardGame-${item.id}`}
                      className="w-full min-w-0"
                    >
                      <BoardGameCard
                        game={item}
                        onClick={() => setSelectedBoardGame(item)}
                      />
                    </div>
                  );
                }

                return null;
              })}
          </div>
        </div>
      </section>

      {/* ----------------------------- */}
      {/* BOOK MODAL */}
      {/* ----------------------------- */}

      {selectedBook && (
        <ProductModal
          book={selectedBook}
          onClose={() =>
            setSelectedBook(null)
          }
        />
      )}

      {/* ----------------------------- */}
      {/* COLLECTION MODAL */}
      {/* ----------------------------- */}

      {selectedCollection && (
        <ProductCollectionModal
          collection={selectedCollection}
          onClose={() =>
            setSelectedCollection(null)
          }
        />
      )}

      {/* ----------------------------- */}
      {/* COMIC MODAL */}
      {/* ----------------------------- */}

      {selectedComic && (
        <ProductComicModal
          comic={selectedComic}
          seller={
            sellers[selectedComic.sellerId]
          }
          onClose={() =>
            setSelectedComic(null)
          }
        />
      )}

      {/* ----------------------------- */}
      {/* BOARD GAME MODAL */}
      {/* ----------------------------- */}

      {selectedBoardGame && (
        <BoardGameModal
          game={selectedBoardGame}
          onClose={() => setSelectedBoardGame(null)}
        />
      )}
    </>
  );
};

export default MostNew;