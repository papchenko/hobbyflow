import { useEffect, useState, useRef } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { BsFileImage } from "react-icons/bs";
import { FaBook, FaDice, FaPerson } from "react-icons/fa6";
import { BiCategoryAlt } from "react-icons/bi";
import { SiBookstack } from "react-icons/si";

const GlobalSearch = () => {
  const [queryText, setQueryText] = useState("");
  const [results, setResults] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const allGenres = [
    "Fantasy",
    "Science Fiction",
    "Drama",
    "Romance",
    "Mystery",
    "Detective",
    "Thriller",
    "Horror",
    "Historical",
    "Adventure",
    "Dystopian",
    "Post-Apocalyptic",
    "Magical Realism",
    "Cyberpunk",
    "Biography",
    "Self-Help",
    "History",
    "Philosophy",
    "Psychology",
    "Crime Fiction",
    "Business",
    "Science & Technology",
    "Health & Fitness",
    "Travel",
    "Children’s",
    "Young Adult",
    "Educational",
    "Poetry",
    "Comics",
  ];

  useEffect(() => {
    const search = async () => {
      if (!queryText.trim()) {
        setResults([]);
        if (dropdownVisible) setDropdownVisible(false);
        return;
      }

      const text = queryText.toLowerCase();

      try {
        const booksSnap = await getDocs(collection(db, "books"));

        const books = booksSnap.docs
          .map((d) => ({ id: d.id, type: "book", ...d.data() }))
          .filter((b) => b.name?.toLowerCase().includes(text))
          .slice(0, 5);

        const usersSnap = await getDocs(collection(db, "users"));

        const sellers = usersSnap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              type: "seller",
              name: data.name || "",
              taker: data.taker,
              ...data,
            };
          })
          .filter(
            (u) =>
              u.taker === true && u.name && u.name.toLowerCase().includes(text),
          )
          .slice(0, 5);

        const collectionsSnap = await getDocs(
          collection(db, "bookCollections"),
        );

        const bookCollections = collectionsSnap.docs
          .map((d) => {
            const data = d.data();

            return {
              id: d.id,
              type: "collection",
              name: data.collectionName || "",
              collectionName: data.collectionName || "",
              seriesName: data.seriesName || "",
              ...data,
            };
          })
          .filter((c) => (c.collectionName || "").toLowerCase().includes(text))
          .slice(0, 5);
// ==========================================
// SEARCH COMICS
// ==========================================

const comicsSnap = await getDocs(
  collection(db, "comics")
);

const comics = comicsSnap.docs
  .map((d) => ({
    ...d.data(),
    id: d.id,
    type: "comic",
  }))
  .filter((comic) =>
    (comic.name || "")
      .toLowerCase()
      .includes(text)
  )
  .slice(0, 5);

// ==========================================
// SEARCH BOARD GAMES
// ==========================================

const boardGamesSnap = await getDocs(
  collection(db, "boardGames")
);

const boardGames = boardGamesSnap.docs
  .map((d) => ({
    ...d.data(),
    id: d.id,
    type: "boardGame",
  }))
  .filter((game) =>
    (game.name || "")
      .toLowerCase()
      .includes(text)
  )
  .slice(0, 5);
        const genres = allGenres
          .filter((g) => g.toLowerCase().includes(text))
          .slice(0, 5)
          .map((g) => ({ id: g, type: "genre", name: g }));

        const combined = [
  ...books,
  ...bookCollections,
  ...comics,
  ...boardGames,
  ...sellers,
  ...genres,
];

        setResults(combined);
        setDropdownVisible(combined.length > 0);
      } catch (error) {
        console.error("Search error:", error);
        if (dropdownVisible) setDropdownVisible(false);
      }
    };

    const delay = setTimeout(search, 300);
    return () => clearTimeout(delay);
  }, [queryText]);

  useEffect(() => {
    if (dropdownVisible && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();

      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        maxWidth: "95vw",
        zIndex: 9999,
      });
    }
  }, [dropdownVisible]);

const handleClick = (item) => {
  if (item.type === "book") {
    navigate(`/books?bookId=${item.id}`);
  }

  if (item.type === "seller") {
    navigate(`/takers/${item.id}`);
  }

  if (item.type === "collection") {
    navigate(`/book-collections?collectionId=${item.id}`);
  }

  if (item.type === "comic") {
    navigate(`/comics?comicId=${encodeURIComponent(item.id)}`);
  }

  if (item.type === "boardGame") {
    navigate(`/board-games?boardGameId=${encodeURIComponent(item.id)}`);
  }

  if (item.type === "genre") {
    navigate(`/books?genre=${encodeURIComponent(item.name)}`);
  }

  clearSearch();
};

  const clearSearch = () => {
    setQueryText("");
    setResults([]);
    if (dropdownVisible) setDropdownVisible(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideInput =
        containerRef.current && !containerRef.current.contains(event.target);

      const clickedOutsideDropdown =
        dropdownRef.current && !dropdownRef.current.contains(event.target);

      if (clickedOutsideInput && clickedOutsideDropdown) {
        setDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setDropdownVisible(false);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      <div ref={containerRef} className="relative w-64">
        <input
          ref={inputRef}
          type="text"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          onFocus={() => results.length && setDropdownVisible(true)}
          placeholder="Search HobbyFlow..."
          className="w-full border rounded px-3 py-2 pr-8"
        />
        {queryText && (
          <div
            type="button"
            onClick={clearSearch}
            className="
                absolute right-0 sm:right-2
                top-1/2 -translate-y-1/2
                flex items-center justify-center
                w-8 h-8 sm:w-7 sm:h-7
                rounded-full
                text-gray-400
                text-2xl
                md:text-sm
                hover:text-gray-700
                active:scale-90
                transition
                dark:hover:text-white
            ">
            ✕
          </div>
        )}
      </div>

      {dropdownVisible &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-white dark:bg-gray-800 border border-gray-200 
                       dark:border-gray-700 rounded-md shadow-lg 
                       max-h-80 overflow-y-auto">
            {results.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => handleClick(item)}
                className="px-3 py-2 hover:bg-gray-100 
                           dark:hover:bg-gray-700 cursor-pointer 
                           text-sm flex items-center gap-2 text-gray-700 dark:text-white">
                {item.type === "book" && <FaBook />}
{item.type === "collection" && <SiBookstack />}
{item.type === "comic" && <BsFileImage />}
{item.type === "boardGame" && (
  <FaDice />
)}
{item.type === "seller" && <FaPerson />}
{item.type === "genre" && <BiCategoryAlt />}
                {item.name}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};

export default GlobalSearch;
