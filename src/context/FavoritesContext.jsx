import {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

const FavoritesContext = createContext();

const getFavoriteField = (type) => {
  switch (type) {
    case "collection":
      return "collectionId";
    case "comic":
      return "comicId";
    case "boardGame":
      return "boardGameId";
    default:
      return "bookId";
  }
};

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (!user) {
      setFavorites([]);
      return;
    }

    let active = true;

    const fetchFavorites = async () => {
      try {
        const q = query(
          collection(db, "favorites"),
          where("userId", "==", user.uid)
        );

        const snap = await getDocs(q);

        const loadedFavorites = snap.docs.map((favoriteDoc) => {
          const data = favoriteDoc.data();

          return {
            id: favoriteDoc.id,
            bookId: data.bookId || null,
            collectionId: data.collectionId || null,
            comicId: data.comicId || null,
            boardGameId: data.boardGameId || null,
            type:
              data.type ||
              (data.boardGameId
                ? "boardGame"
                : data.comicId
                ? "comic"
                : data.collectionId
                ? "collection"
                : "book"),
          };
        });

        if (active) setFavorites(loadedFavorites);
      } catch (error) {
        console.error("Error fetching favorites:", error);
        toast.error("Error fetching favorites");
      }
    };

    fetchFavorites();

    return () => {
      active = false;
    };
  }, [user]);

  const addFavorite = async (itemId, type = "book") => {
    if (!user) {
      toast.error("Login to add favorite");
      return;
    }

    if (!itemId) return;

    const field = getFavoriteField(type);

    if (favorites.some((item) => item[field] === itemId)) {
      return;
    }

    try {
      const favoriteData = {
        userId: user.uid,
        createdAt: serverTimestamp(),
        [field]: itemId,
      };

      // Зберігаємо старий формат книжкових записів.
      if (type !== "book") {
        favoriteData.type = type;
      }

      const ref = await addDoc(
        collection(db, "favorites"),
        favoriteData
      );

      setFavorites((prev) => [
        ...prev,
        {
          id: ref.id,
          bookId: type === "book" ? itemId : null,
          collectionId: type === "collection" ? itemId : null,
          comicId: type === "comic" ? itemId : null,
          boardGameId: type === "boardGame" ? itemId : null,
          type,
        },
      ]);

      toast.success("Added to favorites");
    } catch (error) {
      console.error("Error adding favorite:", error);
      toast.error("Error adding favorite");
    }
  };

  const removeFavorite = async (itemId, type = "book") => {
    if (!user || !itemId) return;

    const field = getFavoriteField(type);

    const favorite = favorites.find(
      (item) => item[field] === itemId
    );

    if (!favorite) return;

    try {
      await deleteDoc(doc(db, "favorites", favorite.id));

      setFavorites((prev) =>
        prev.filter((item) => item.id !== favorite.id)
      );

      toast.success("Removed from favorites");
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Error removing favorite");
    }
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () =>
  useContext(FavoritesContext);
