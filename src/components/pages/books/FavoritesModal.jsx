import { useEffect, useState } from "react";
import {
  FaTimes,
  FaTrash,
} from "react-icons/fa";

import {
  FaBook,
  FaHeart,
  FaMasksTheater,
  FaDice,
} from "react-icons/fa6";

import { useAuth } from "../../../context/AuthContext";
import { useCart } from "../../../context/CartContext";
import { toast } from "react-toastify";

import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "../../../firebase";

import { useNavigate } from "react-router-dom";

const FavoritesModal = ({
  isOpen,
  setIsOpen,
}) => {
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [favorites, setFavorites] =
    useState([]);

  const [booksData, setBooksData] =
    useState([]);

  const [
    collectionsData,
    setCollectionsData,
  ] = useState([]);

  const [
  comicsData,
  setComicsData,
] = useState([]);

const [boardGamesData, setBoardGamesData] = useState([]);

  const navigate = useNavigate();

  /* -----------------------------
     NO SCROLL
  ----------------------------- */

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add(
        "no-scroll",
      );
    } else {
      document.body.classList.remove(
        "no-scroll",
      );
    }

    return () => {
      document.body.classList.remove(
        "no-scroll",
      );
    };
  }, [isOpen]);

  /* -----------------------------
     LOAD FAVORITES
  ----------------------------- */

useEffect(() => {
  if (!user || !isOpen) return;

  const fetchFavorites = async () => {
    try {
      const favQuery = query(
        collection(db, "favorites"),
        where("userId", "==", user.uid),
      );

      const favSnap = await getDocs(favQuery);

      const favs = favSnap.docs.map(
        (favoriteDoc) => ({
          id: favoriteDoc.id,
          ...favoriteDoc.data(),
        }),
      );

      setFavorites(favs);

      /* -------------------------
         BOOK FAVORITES
      ------------------------- */

      const bookFavs = favs.filter(
        (fav) =>
          fav.type === "book" ||
          (!fav.type && fav.bookId),
      );

      /* -------------------------
         COLLECTION FAVORITES
      ------------------------- */

      const collectionFavs = favs.filter(
        (fav) =>
          fav.type === "collection" ||
          fav.collectionId,
      );

      /* -------------------------
         COMIC FAVORITES
      ------------------------- */

      const comicFavs = favs.filter(
        (fav) =>
          fav.type === "comic" &&
          (fav.comicId || fav.itemId),
      );

      /* -------------------------
         LOAD BOOKS
      ------------------------- */

      const bookPromises = bookFavs.map((fav) =>
        getDoc(
          doc(
            db,
            "books",
            fav.bookId,
          ),
        ),
      );

      /* -------------------------
         LOAD COLLECTIONS
      ------------------------- */

      const collectionPromises =
        collectionFavs.map((fav) =>
          getDoc(
            doc(
              db,
              "bookCollections",
              fav.collectionId,
            ),
          ),
        );

      /* -------------------------
         LOAD COMICS
      ------------------------- */

      const comicPromises = comicFavs.map(
        (fav) => {
          const comicId =
            fav.comicId || fav.itemId;

          return getDoc(
            doc(
              db,
              "comics",
              comicId,
            ),
          );
        },
      );
/* -------------------------
   LOAD BOARD GAMES
------------------------- */

const boardGameFavs = favs.filter(
  (fav) =>
    fav.type === "boardGame" &&
    Boolean(fav.boardGameId)
);

const boardGamePromises = boardGameFavs.map(
  (fav) =>
    getDoc(
      doc(db, "boardGames", fav.boardGameId)
    )
);
      /* -------------------------
         LOAD ALL DATA
      ------------------------- */

      const [
  bookSnaps,
  collectionSnaps,
  comicSnaps,
  boardGameSnaps,
] = await Promise.all([
  Promise.all(bookPromises),
  Promise.all(collectionPromises),
  Promise.all(comicPromises),
  Promise.all(boardGamePromises),
]);

      /* -------------------------
         BOOKS DATA
      ------------------------- */

      const books = bookSnaps
        .filter((snap) =>
          snap.exists(),
        )
        .map((snap) => ({
          id: snap.id,
          ...snap.data(),
        }));

      /* -------------------------
         COLLECTIONS DATA
      ------------------------- */

      const collections =
        collectionSnaps
          .filter((snap) =>
            snap.exists(),
          )
          .map((snap) => ({
            id: snap.id,
            ...snap.data(),
          }));

      /* -------------------------
         COMICS DATA
      ------------------------- */

      const comics = comicSnaps
        .filter((snap) =>
          snap.exists(),
        )
        .map((snap) => ({
          id: snap.id,
          ...snap.data(),
        }));

      const boardGames = boardGameSnaps
  .filter((snap) => snap.exists())
  .map((snap) => ({
    id: snap.id,
    ...snap.data(),
    type: "boardGame",
  }));

setBooksData(books);
setCollectionsData(collections);
setComicsData(comics);
setBoardGamesData(boardGames);
    } catch (error) {
      console.error(
        "Error fetching favorites:",
        error,
      );

      toast.error(
        "Error fetching favorites.",
      );
    }
  };

  fetchFavorites();
}, [user, isOpen]);

  /* -----------------------------
     REMOVE BOOK FAVORITE
  ----------------------------- */

  const removeBookFavorite =
    async (
      favId,
      bookId,
    ) => {
      try {
        await deleteDoc(
          doc(
            db,
            "favorites",
            favId,
          ),
        );

        setFavorites((prev) =>
          prev.filter(
            (favorite) =>
              favorite.id !==
              favId,
          ),
        );

        setBooksData((prev) =>
          prev.filter(
            (book) =>
              book.id !== bookId,
          ),
        );
      } catch (error) {
        console.error(error);

        toast.error(
          "Error removing favorite.",
        );
      }
    };

  /* -----------------------------
     REMOVE COLLECTION FAVORITE
  ----------------------------- */

  const removeCollectionFavorite =
    async (
      favId,
      collectionId,
    ) => {
      try {
        await deleteDoc(
          doc(
            db,
            "favorites",
            favId,
          ),
        );

        setFavorites((prev) =>
          prev.filter(
            (favorite) =>
              favorite.id !==
              favId,
          ),
        );

        setCollectionsData(
          (prev) =>
            prev.filter(
              (item) =>
                item.id !==
                collectionId,
            ),
        );
      } catch (error) {
        console.error(error);

        toast.error(
          "Error removing favorite.",
        );
      }
    };

    /* -----------------------------
   REMOVE COMIC FAVORITE
----------------------------- */

const removeComicFavorite =
  async (
    favId,
    comicId,
  ) => {
    try {
      await deleteDoc(
        doc(
          db,
          "favorites",
          favId,
        ),
      );

      setFavorites((prev) =>
        prev.filter(
          (favorite) =>
            favorite.id !==
            favId,
        ),
      );

      setComicsData((prev) =>
        prev.filter(
          (comic) =>
            comic.id !== comicId,
        ),
      );
    } catch (error) {
      console.error(error);

      toast.error(
        "Error removing favorite.",
      );
    }
  };
/* -----------------------------
   REMOVE BOARD GAME FAVORITE
----------------------------- */

const removeBoardGameFavorite = async (
  favId,
  boardGameId
) => {
  if (!favId) return;

  try {
    await deleteDoc(
      doc(db, "favorites", favId)
    );

    setFavorites((prev) =>
      prev.filter((fav) => fav.id !== favId)
    );

    setBoardGamesData((prev) =>
      prev.filter((game) => game.id !== boardGameId)
    );

    toast.success("Removed from favorites");
  } catch (error) {
    console.error("Remove board game favorite:", error);
    toast.error("Could not remove favorite");
  }
};
  /* -----------------------------
     ESC
  ----------------------------- */

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleEsc,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleEsc,
      );
  }, [setIsOpen]);

  /* -----------------------------
     ADD BOOK TO CART
  ----------------------------- */

  const handleAddToCart = async (
    book,
  ) => {
    if (!user) {
      toast.error("Login first");
      return;
    }

    addToCart({
      ...book,
      type: "book",
      purchaseType: "full",
      quantity: 1,
    });

    const fav =
      favorites.find(
        (favorite) =>
          favorite.bookId ===
          book.id,
      );

    if (fav) {
      await removeBookFavorite(
        fav.id,
        book.id,
      );
    }
  };
const handleAddCollectionToCart = async (
  bookCollection,
) => {
  if (!user) {
    toast.error("Login first");
    return;
  }

  addToCart({
    id: bookCollection.id,

    collectionId:
      bookCollection.id,

    name:
      bookCollection.collectionName ||
      "Book Collection",

    image:
      bookCollection.books?.[0]?.image ||
      bookCollection.books?.[0]?.images?.[0] ||
      "",

    price:
      Number(
        bookCollection.price || 0,
      ),

    type: "collection",

    purchaseType: "full",

    quantity: 1,

    /*
      Передаємо всю колекцію
    */
    collection:
      bookCollection,

    /*
      Також залишаємо books
      на верхньому рівні
    */
    books:
      bookCollection.books || [],

    bookCount:
      bookCollection.bookCount ||
      bookCollection.books?.length ||
      0,
  });

  const fav = favorites.find(
    (favorite) =>
      favorite.collectionId ===
      bookCollection.id,
  );

  if (fav) {
    await removeCollectionFavorite(
      fav.id,
      bookCollection.id,
    );
  }
};

/* -----------------------------
   ADD COMIC TO CART
----------------------------- */

const handleAddComicToCart = async (
  comic,
) => {
  if (!user) {
    toast.error("Login first");
    return;
  }

  addToCart({
    ...comic,
    id: comic.id,
    comicId: comic.id,
    type: "comic",
    purchaseType: "full",
    quantity: 1,
  });

  const fav = favorites.find(
    (favorite) =>
      favorite.type === "comic" &&
      (
        favorite.comicId === comic.id ||
        favorite.itemId === comic.id
      ),
  );

  if (fav) {
    await removeComicFavorite(
      fav.id,
      comic.id,
    );
  }
};
/* -----------------------------
   ADD BOARD GAME TO CART
----------------------------- */

const handleAddBoardGameToCart = async (game) => {
  if (!user) {
    toast.error("Login first");
    return;
  }

  if (
    game.isCurrentlyRented === true ||
    Boolean(game.activeRentalOrderId)
  ) {
    toast.error("This board game is currently rented.");
    return;
  }

  const listingType =
    game.listingType ||
    (game.isLendingAvailable
      ? "sale_and_rental"
      : "sale");

  const isRentalOnly = listingType === "rental_only";
  const isLendingAvailable = listingType !== "sale";

  const purchaseType = isRentalOnly ? "rental" : "full";

  const price = isRentalOnly
    ? Number(game.priceLending || 0)
    : Number(game.price || 0);

  if (!Number.isFinite(price) || price <= 0) {
    toast.error("Invalid board game price.");
    return;
  }

  const added = await addToCart({
    ...game,
    id: game.id,
    boardGameId: game.id,
    type: "boardGame",
    listingType,
    purchaseType,
    price: isRentalOnly ? null : Number(game.price),
    priceLending: isLendingAvailable
      ? Number(game.priceLending || 0)
      : 0,
    isLendingAvailable,
    unit: isLendingAvailable ? game.unit || null : null,
    finalPrice: price,
    quantity: 1,
  });

  if (added === false) return;

  const fav = favorites.find(
    (favorite) => favorite.boardGameId === game.id
  );

  if (fav) {
    await removeBoardGameFavorite(fav.id, game.id);
  }
};
  if (!isOpen) return null;

const hasFavorites =
  booksData.length > 0 ||
  collectionsData.length > 0 ||
  comicsData.length > 0 ||
  boardGamesData.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end"
      onClick={() =>
        setIsOpen(false)
      }
    >
      <div
        className="
          bg-white dark:bg-gray-800
          w-full
          h-[100vh]
          md:h-[90vh]
          md:my-auto

          md:max-w-xl
          lg:max-w-2xl
          shadow-xl
          flex flex-col
          overflow-hidden
          transition-transform duration-300
        "
        //           md:mr-6
        //  md:mt-9
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* HEADER */}

        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {hasFavorites
              ? "Your Favorites"
              : "Favorites is Empty"}
          </h2>

          <button
            onClick={() =>
              setIsOpen(false)
            }
            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 p-2 rounded-full"
          >
            <FaTimes className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* CONTENT */}

        <div className="flex-grow overflow-y-auto p-4">

          {!hasFavorites ? (
            <div className="text-center py-8">

              <p className="text-gray-500 mb-4">
                You have no favorite
                books or collections.
              </p>

             {/* <div className="flex items-center gap-4 justify-center">
               <button
                onClick={() => {
                  navigate(
                    "/",
                  );

                  setIsOpen(false);
                }}
                className="bg-green-600 hover:bg-green-700 text-white py-1 px-4 rounded-full"
              >
                Home
              </button>
             </div> */}

            </div>
          ) : (
            <div className="space-y-8">

              {/* =====================
                  BOOKS
              ====================== */}

              {booksData.length >
                0 && (
                <section>

                  <div className="flex items-center gap-2 mb-3">
                    <FaBook className="text-[var(--secondary-color)]" />

                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                      Books
                    </h3>
                  </div>

                  <div className="space-y-4">

                    {booksData.map(
                      (book) => {

                        const fav =
                          favorites.find(
                            (favorite) =>
                              favorite.bookId ===
                              book.id,
                          );

                        return (
                          <div
                            key={
                              book.id
                            }
                            className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700"
                          >

                            <img
                              src={
                                book
                                  .images?.[0]
                              }
                              alt={
                                book.name
                              }
                              className="w-16 h-20 object-cover rounded-md"
                            />

                            <div
                              className="flex-grow cursor-pointer"
                              onClick={() => {
                                setIsOpen(
                                  false,
                                );

                                navigate(
                                  `/books?bookId=${book.id}`,
                                );
                              }}
                            >
                              <h3 className="font-bold text-gray-700 dark:text-gray-300 max-w-[180px] truncate">
                                {
                                  book.name
                                }
                              </h3>

                              <p className="text-gray-700 dark:text-white font-medium">
                                {
                                  book.price
                                }{" "}
                                ₴
                              </p>

                              <p className="text-sm text-green-500">
                                <span className="text-gray-700 dark:text-white">
                                  Lending Price:
                                </span>{" "}
                                {
                                  book.priceLending
                                }{" "}
                                ₴
                              </p>
                            </div>

                            <div className="flex flex-row gap-2 items-center">

                              <button
                                onClick={() =>
                                  removeBookFavorite(
                                    fav.id,
                                    book.id,
                                  )
                                }
                                className="text-red-500 p-1"
                                title="Remove from favorites"
                              >
                                <FaTrash />
                              </button>

                              <button
                                onClick={() =>
                                  handleAddToCart(
                                    book,
                                  )
                                }
                                className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-full text-sm flex-shrink-0"
                              >
                                Add to Cart
                              </button>

                            </div>

                          </div>
                        );
                      },
                    )}

                  </div>
                </section>
              )}

              {/* =====================
                  COLLECTIONS
              ====================== */}

              {collectionsData.length >
                0 && (
                <section>

                  <div className="flex items-center gap-2 mb-3">
                    <FaHeart className="text-[var(--secondary-color)]" />

                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                      Collections
                    </h3>
                  </div>

                  <div className="space-y-4">

                    {collectionsData.map(
                      (bookCollection) => {

                        const fav =
                          favorites.find(
                            (favorite) =>
                              favorite.collectionId ===
                              bookCollection.id,
                          );

                        return (
                          <div
                            key={
                              bookCollection.id
                            }
                            className="flex items-center gap-3 p-2 border-b border-gray-200 dark:border-gray-700"
                          >

                            {/* COVER */}

                            <div
                              className="w-16 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-900 rounded-md flex items-center justify-center overflow-hidden cursor-pointer"
                              onClick={() => {
                                setIsOpen(
                                  false,
                                );

                                navigate(
                                  `/book-collections?collectionId=${bookCollection.id}`,
                                );
                              }}
                            >
                              {bookCollection
                                .books?.[0]
                                ?.image ? (
                                <img
                                  src={
                                    bookCollection
                                      .books?.[0]
                                      ?.image
                                  }
                                  alt={
                                    bookCollection.collectionName
                                  }
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <FaBook className="text-gray-400 text-2xl" />
                              )}
                            </div>

                            {/* INFO */}

                            <div
                              className="flex-grow min-w-0 cursor-pointer"
                              onClick={() => {
                                setIsOpen(
                                  false,
                                );

                                navigate(
                                  `/book-collections?collectionId=${bookCollection.id}`,
                                );
                              }}
                            >
                              <h3 className="font-bold text-gray-700 dark:text-gray-300 truncate">
                                {
                                  bookCollection.collectionName
                                }
                              </h3>

                              {bookCollection.seriesName && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                  {
                                    bookCollection.seriesName
                                  }
                                </p>
                              )}

                              <p className="text-gray-700 dark:text-white font-medium">
                                {Number(
                                  bookCollection.price ||
                                    0,
                                ).toFixed(
                                  2,
                                )}{" "}
                                ₴
                              </p>

                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {
                                  bookCollection.bookCount ||
                                  bookCollection.books
                                    ?.length ||
                                  0
                                }{" "}
                                books
                              </p>
                            </div>

                            {/* ACTIONS */}

<div className="flex flex-row gap-2 items-center flex-shrink-0">

  <button
    onClick={() =>
      removeCollectionFavorite(
        fav.id,
        bookCollection.id,
      )
    }
    className="text-red-500 p-1"
    title="Remove from favorites"
  >
    <FaTrash />
  </button>

  <button
    onClick={() =>
      handleAddCollectionToCart(
        bookCollection,
      )
    }
    className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-full text-sm whitespace-nowrap"
  >
    Add to Cart
  </button>

</div>

                          </div>
                        );
                      },
                    )}

                  </div>
                </section>
              )}
{/* =====================
    COMICS
====================== */}

{comicsData.length > 0 && (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <FaMasksTheater className="text-[var(--secondary-color)]" />

      <h3 className="text-lg font-bold text-gray-800 dark:text-white">
        Comics
      </h3>
    </div>

    <div className="space-y-4">
      {comicsData.map((comic) => {
        const fav = favorites.find(
          (favorite) =>
            favorite.type === "comic" &&
            (
              favorite.comicId === comic.id ||
              favorite.itemId === comic.id
            ),
        );

        return (
          <div
            key={comic.id}
            className="
              flex
              items-center
              gap-3
              p-2
              border-b
              border-gray-200
              dark:border-gray-700
            "
          >
            {/* COVER */}

            <div
              className="
                w-16
                h-20
                flex-shrink-0
                bg-gray-100
                dark:bg-gray-900
                rounded-md
                flex
                items-center
                justify-center
                overflow-hidden
                cursor-pointer
              "
              onClick={() => {
                setIsOpen(false);

                navigate(
                  `/comics?comicId=${comic.id}`,
                );
              }}
            >
              {comic.images?.[0] ? (
                <img
                  src={comic.images[0]}
                  alt={comic.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <FaMasksTheater className="text-gray-400 text-2xl" />
              )}
            </div>

            {/* INFO */}

            <div
              className="
                flex-grow
                min-w-0
                cursor-pointer
              "
              onClick={() => {
                setIsOpen(false);

                navigate(
                  `/comics?comicId=${comic.id}`,
                );
              }}
            >
              <h3 className="font-bold text-gray-700 dark:text-gray-300 truncate">
                {comic.name}
              </h3>

              {comic.author && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  Writer: {comic.author}
                </p>
              )}

              {comic.artist && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  Artist: {comic.artist}
                </p>
              )}

              {comic.genre && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {comic.genre}
                </p>
              )}

              <p className="text-gray-700 dark:text-white font-medium">
                {Number(
                  comic.price || 0,
                ).toFixed(2)}{" "}
                ₴
              </p>
            </div>

{/* ACTIONS */}

<div className="flex flex-row gap-2 items-center flex-shrink-0">

  <button
    type="button"
    onClick={() =>
      removeComicFavorite(
        fav.id,
        comic.id,
      )
    }
    className="text-red-500 p-1"
    title="Remove from favorites"
  >
    <FaTrash />
  </button>

  <button
    type="button"
    onClick={() =>
      handleAddComicToCart(
        comic,
      )
    }
    className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded-full text-sm whitespace-nowrap"
  >
    Add to Cart
  </button>

</div>
          </div>
        );
      })}
    </div>
  </section>
)}
{/* =====================
    BOARD GAMES
====================== */}

{boardGamesData.length > 0 && (
  <section>
    <div className="flex items-center gap-2 mb-3">
      <FaDice className="text-[var(--secondary-color)]" />

      <h3 className="text-lg font-bold text-gray-800 dark:text-white">
        Board Games
      </h3>
    </div>

    <div className="space-y-4">
      {boardGamesData.map((game) => {
        const fav = favorites.find(
          (favorite) =>
            favorite.boardGameId === game.id
        );

        return (
          <div
            key={game.id}
            className="flex items-center gap-3 p-2 border-b border-gray-200 dark:border-gray-700"
          >
            <div
              className="w-16 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-900 rounded-md flex items-center justify-center overflow-hidden cursor-pointer"
              onClick={() => {
                setIsOpen(false);
                navigate(`/board-games?gameId=${game.id}`);
              }}
            >
              {game.images?.[0] ? (
                <img
                  src={game.images[0]}
                  alt={game.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <FaDice className="text-gray-400 text-2xl" />
              )}
            </div>

            <div
              className="flex-grow min-w-0 cursor-pointer"
              onClick={() => {
                setIsOpen(false);
                navigate(`/board-games?gameId=${game.id}`);
              }}
            >
              <h3 className="font-bold text-gray-700 dark:text-gray-300 truncate">
                {game.name}
              </h3>

              {game.category && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {game.category}
                </p>
              )}

              {game.listingType !== "rental_only" && (
                <p className="font-medium text-gray-700 dark:text-white">
                  {Number(game.price || 0).toFixed(2)} ₴
                </p>
              )}

              {game.listingType !== "sale" &&
                Number(game.priceLending) > 0 && (
                  <p className="text-sm text-green-600">
                    Rental: {Number(game.priceLending).toFixed(2)} ₴
                  </p>
                )}
            </div>

            <div className="flex flex-row gap-2 items-center flex-shrink-0">
              <button
                type="button"
                onClick={() =>
                  removeBoardGameFavorite(fav?.id, game.id)
                }
                className="text-red-500 p-1"
                title="Remove from favorites"
              >
                <FaTrash />
              </button>

     <button
  type="button"
  onClick={() => handleAddBoardGameToCart(game)}
  disabled={
    game.isCurrentlyRented === true ||
    Boolean(game.activeRentalOrderId)
  }
  className="
    bg-green-600 hover:bg-green-700
    text-white py-1 px-3 rounded-full
    text-sm whitespace-nowrap
    disabled:opacity-50
    disabled:cursor-not-allowed
  "
>
  {game.isCurrentlyRented === true ||
  Boolean(game.activeRentalOrderId)
    ? "Currently Rented"
    : "Add to Cart"}
</button>
            </div>
          </div>
        );
      })}
    </div>
  </section>
)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FavoritesModal;