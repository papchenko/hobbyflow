import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { db } from "../../../../firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";
import { uploadAvatar as uploadToCloudinary } from "../../../utils/cloudinary";
import { FaTimes, FaTrash, FaPlus } from "react-icons/fa";
import {
  BOOK_LANGUAGES,
  BOOK_CONDITIONS,
} from "../../../../constants/bookMeta";

import "../../../../styles/bookMetaFields.scss";

const GENRES = [
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

const COMPLETENESS_OPTIONS = [
  {
    value: "full",
    label: "Full collection",
    description: "Complete collection",
  },
  {
    value: "half",
    label: "Half collection — 1/2",
    description: "Approximately half of the complete collection",
  },
  {
    value: "third",
    label: "Third collection — 1/3",
    description: "Approximately one third of the complete collection",
  },
  {
    value: "two-thirds",
    label: "Two thirds — 2/3",
    description: "Approximately two thirds of the complete collection",
  },
  {
    value: "part-1",
    label: "Part 1",
    description: "First part of a collection",
  },
  {
    value: "part-2",
    label: "Part 2",
    description: "Second part of a collection",
  },
  {
    value: "part-3",
    label: "Part 3",
    description: "Third part of a collection",
  },
  {
    value: "custom",
    label: "Custom",
    description: "Specify manually",
  },
];

const CreatePostFormCollections = ({ onClose }) => {
  const { user, userProfile } = useAuth();

  const [collectionName, setCollectionName] = useState("");
  const [seriesName, setSeriesName] = useState("");
  const [author, setAuthor] = useState("");
  const [genre, setGenre] = useState("");
  const [completeness, setCompleteness] = useState("full");
  const [customCompleteness, setCustomCompleteness] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");

const createEmptyBook = () => ({
  title: "",
  author: "",
  year: "",
  pages: "",
  language: "",
  condition: "",
  description: "",

  image: "",
  images: [],

  imageFile: null,
});
const [books, setBooks] = useState([
  createEmptyBook(),
  createEmptyBook(),
  createEmptyBook(),
]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  const updateBook = (index, field, value) => {
    setBooks((prev) =>
      prev.map((book, i) =>
        i === index
          ? {
              ...book,
              [field]: value,
            }
          : book,
      ),
    );
  };

  const addBook = () => {
    if (books.length >= 20) {
      toast.error("Maximum 20 books per collection");
      return;
    }

    setBooks((prev) => [
  ...prev,
  createEmptyBook(),
]);
  };

  const removeBook = (index) => {
    if (books.length <= 2) {
      toast.error("A collection must contain at least 2 books");
      return;
    }

    setBooks((prev) => prev.filter((_, i) => i !== index));
  };

const handleBookImagesUpload = async (index, e) => {
  const files = Array.from(e.target.files || []);

  if (!files.length) return;

  const currentImages = books[index]?.images || [];

  if (currentImages.length + files.length > 3) {
    toast.error("Maximum 3 photos per book");
    e.target.value = "";
    return;
  }

  try {
    const uploadedUrls = await Promise.all(
      files.map((file) =>
        uploadToCloudinary(file)
      ),
    );

    const nextImages = [
      ...currentImages,
      ...uploadedUrls,
    ].slice(0, 3);

    updateBook(
      index,
      "images",
      nextImages,
    );

    updateBook(
      index,
      "image",
      nextImages[0] || "",
    );

    toast.success(
      `${uploadedUrls.length} photo${
        uploadedUrls.length > 1 ? "s" : ""
      } uploaded`,
    );
  } catch (error) {
    console.error(
      "Book images upload error:",
      error,
    );

    toast.error(
      "Failed to upload book photos",
    );
  } finally {
    e.target.value = "";
  }
};

const removeBookImage = (
  bookIndex,
  imageIndex,
) => {
  setBooks((prev) =>
    prev.map((book, index) => {
      if (index !== bookIndex) {
        return book;
      }

      const images = Array.isArray(book.images)
        ? book.images.filter(Boolean)
        : [];

      const nextImages = images.filter(
        (_, i) => i !== imageIndex,
      );

      return {
        ...book,

        images: nextImages,

        image:
          nextImages[0] || "",
      };
    }),
  );
};

  const getCompletenessLabel = () => {
    if (completeness === "custom") {
      return customCompleteness.trim();
    }

    return (
      COMPLETENESS_OPTIONS.find(
        (option) => option.value === completeness,
      )?.label || ""
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.uid) {
      toast.error("You must be logged in");
      return;
    }

    if (
      !collectionName.trim() ||
      !genre ||
      !price ||
      !description.trim()
    ) {
      toast.error("Please fill all collection fields");
      return;
    }

    if (completeness === "custom" && !customCompleteness.trim()) {
      toast.error("Please specify the collection part");
      return;
    }

    const invalidBook = books.some(
  (book) =>
    !book.title.trim() ||
    !book.image ||
    !book.pages ||
    !book.language ||
    !book.condition ||
    !book.description.trim(),
);

if (invalidBook) {
  toast.error(
    "Every book must have title, cover, pages, language, condition and description",
  );
  return;
}
const invalidPages = books.some(
  (book) =>
    !Number.isInteger(Number(book.pages)) ||
    Number(book.pages) < 1 ||
    Number(book.pages) > 10000,
);

if (invalidPages) {
  toast.error(
    "Pages must be a whole number between 1 and 10,000",
  );
  return;
}

    if (books.length < 2) {
      toast.error("A collection must contain at least 2 books");
      return;
    }

    try {
      setIsSubmitting(true);

      const collectionData = {
        collectionName: collectionName.trim(),
        seriesName: seriesName.trim(),
        author: author.trim(),
        genre,
        completeness,
        completenessLabel: getCompletenessLabel(),
        price: Number(price),
        description: description.trim(),

books: books.map((book, index) => {
  const images = Array.isArray(book.images)
    ? book.images.filter(Boolean).slice(0, 3)
    : book.image
      ? [book.image]
      : [];

  return {
    position: index + 1,

    title: book.title.trim(),

    author: book.author.trim(),

    year:
      book.year
        ? Number(book.year)
        : null,

    pages:
      Number(book.pages),

    language:
      book.language,

    condition:
      book.condition,

    description:
      book.description.trim(),

    image:
      images[0] || "",

    images,
  };
}),

        bookCount: books.length,

        sellerId: user.uid,
        sellerName: userProfile?.name || user.displayName || "Unknown",
        sellerPhoto: userProfile?.photoURL || user.photoURL || "",

        soldCount: 0,

        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "bookCollections"), collectionData);

      toast.success("Book collection posted!");

      onClose();
    } catch (error) {
      console.error("Collection creation error:", error);
      toast.error("Failed to create collection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          <FaTimes className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
          Create Book Collection
        </h2>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Sell several books together as one collection.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* COLLECTION INFO */}
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
              Collection information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                placeholder="Collection name *"
                value={collectionName}
                onChange={(e) => setCollectionName(e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />

              <input
                placeholder="Series name"
                value={seriesName}
                onChange={(e) => setSeriesName(e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />

              <input
                placeholder="Main author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />

              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              >
                <option value="">Select Genre *</option>

                {GENRES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* COMPLETENESS */}
          <div>
            <label className="block font-semibold text-gray-800 dark:text-white mb-2">
              Collection completeness *
            </label>

            <select
              value={completeness}
              onChange={(e) => setCompleteness(e.target.value)}
              className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              {COMPLETENESS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {completeness !== "full" && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {
                  COMPLETENESS_OPTIONS.find(
                    (option) => option.value === completeness,
                  )?.description
                }
              </p>
            )}

            {completeness === "custom" && (
              <input
                placeholder="Example: 4/7 of the complete collection"
                value={customCompleteness}
                onChange={(e) =>
                  setCustomCompleteness(e.target.value)
                }
                className="w-full mt-3 p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            )}
          </div>

          {/* PRICE */}
          <div>
            <label className="block font-semibold text-gray-800 dark:text-white mb-2">
              Total collection price *
            </label>

            <input
              type="number"
              min="0"
              placeholder="Price for the entire collection (₴)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />

            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              This is the price for all books together. Lending is not
              available for collections.
            </p>
          </div>

          {/* BOOKS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white">
                  Books in collection
                </h3>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {books.length} books
                </p>
              </div>

              <button
                type="button"
                onClick={addBook}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--primary-color)] hover:bg-[var(--secondary-color-hover)] text-white transition"
              >
                <FaPlus />
                Add book
              </button>
            </div>

            <div className="space-y-4">
              {books.map((book, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800 dark:text-white">
                      Book #{index + 1}
                    </h4>

                    {books.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeBook(index)}
                        className="text-red-500 hover:text-red-700 transition"
                        title="Remove book"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4">
{/* BOOK PHOTOS */}

<div>
  {(() => {
    const bookImages =
      Array.isArray(book.images)
        ? book.images
        : book.image
          ? [book.image]
          : [];

    return (
      <>
        {/* MAIN IMAGE */}

        <div
          className="
            w-full
            h-44
            rounded-xl
            overflow-hidden
            bg-gray-100
            dark:bg-gray-800
            flex
            items-center
            justify-center
            border
            border-gray-200
            dark:border-gray-700
          "
        >
          {bookImages.length > 0 ? (
            <img
              src={bookImages[0]}
              alt={
                book.title ||
                `Book ${index + 1}`
              }
              className="
                w-full
                h-full
                object-cover
              "
            />
          ) : (
            <span className="text-xs text-gray-400 text-center px-3">
              Book photos
            </span>
          )}
        </div>

        {/* THUMBNAILS */}

        {bookImages.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {bookImages.map(
              (image, imageIndex) => (
                <div
                  key={image}
                  className="
                    relative
                    aspect-square
                    rounded-lg
                    overflow-hidden
                    border
                    border-gray-200
                    dark:border-gray-700
                  "
                >
                  <img
                    src={image}
                    alt={`Book photo ${
                      imageIndex + 1
                    }`}
                    className="
                      w-full
                      h-full
                      object-cover
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      removeBookImage(
                        index,
                        imageIndex,
                      )
                    }
                    className="
                      absolute
                      top-1
                      right-1
                      w-5
                      h-5
                      rounded-full
                      bg-black/70
                      text-white
                      flex
                      items-center
                      justify-center
                      text-[10px]
                      hover:bg-red-600
                      transition
                    "
                    title="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ),
            )}
          </div>
        )}

        {/* UPLOAD */}

        <label
          className={`
            block
            mt-2
            ${
              bookImages.length >= 3
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            }
          `}
        >
          <span
            className="
              block
              text-center
              text-sm
              px-3
              py-2
              rounded-lg
              bg-gray-100
              dark:bg-gray-700
              text-gray-700
              dark:text-gray-200
              hover:bg-gray-200
              dark:hover:bg-gray-600
              transition
            "
          >
            {bookImages.length >= 3
              ? "3 photos added"
              : `Add photos (${bookImages.length}/3)`}
          </span>

          <input
            type="file"
            accept="image/*"
            multiple
            disabled={
              bookImages.length >= 3
            }
            className="hidden"
            onChange={(e) =>
              handleBookImagesUpload(
                index,
                e,
              )
            }
          />
        </label>
      </>
    );
  })()}
</div>

{/* BOOK DATA */}

<div className="space-y-4">

  {/* TITLE */}

  <div className="book-field">
    <label className="book-field__label">
      Book title *
    </label>

    <input
      placeholder="Book title"
      value={book.title}
      onChange={(e) =>
        updateBook(
          index,
          "title",
          e.target.value,
        )
      }
      className="book-meta-input"
    />
  </div>


  {/* AUTHOR */}

  <div className="book-field">
    <label className="book-field__label">
      Author
    </label>

    <input
      placeholder="Author"
      value={book.author}
      onChange={(e) =>
        updateBook(
          index,
          "author",
          e.target.value,
        )
      }
      className="book-meta-input"
    />
  </div>


  {/* YEAR + PAGES */}

  <div className="book-meta-grid">

    <div className="book-field">
      <label className="book-field__label">
        Publication Year
      </label>

      <input
        type="number"
        min="1"
        max="2100"
        placeholder="e.g. 2024"
        value={book.year}
        onChange={(e) =>
          updateBook(
            index,
            "year",
            e.target.value,
          )
        }
        className="book-meta-input"
      />
    </div>


    <div className="book-field">
      <label className="book-field__label">
        Number of Pages *
      </label>

      <input
        type="number"
        min="1"
        max="10000"
        placeholder="e.g. 320"
        value={book.pages}
        onChange={(e) =>
          updateBook(
            index,
            "pages",
            e.target.value,
          )
        }
        className="book-meta-input"
      />
    </div>


    {/* LANGUAGE */}

    <div className="book-field book-field--full">
      <label className="book-field__label">
        Language *
      </label>

      <select
        value={book.language}
        onChange={(e) =>
          updateBook(
            index,
            "language",
            e.target.value,
          )
        }
        className="book-meta-select"
      >
        <option value="">
          Select Language
        </option>

        {BOOK_LANGUAGES.map((language) => (
          <option
            key={language}
            value={language}
          >
            {language}
          </option>
        ))}
      </select>
    </div>

  </div>


  {/* CONDITION */}

  <div className="book-condition-section">

    <label className="book-field__label">
      Book Condition *
    </label>

    <div className="book-condition-grid">

      {BOOK_CONDITIONS.map((item) => (
        <label
          key={item.value}
          className={`book-condition-option ${
            book.condition === item.value
              ? "is-selected"
              : ""
          }`}
        >

          <input
            type="radio"
            name={`book-condition-${index}`}
            value={item.value}
            checked={
              book.condition === item.value
            }
            onChange={(e) =>
              updateBook(
                index,
                "condition",
                e.target.value,
              )
            }
          />

          <div className="book-condition-option__top">

            <span className="book-condition-option__title">
              {item.label}
            </span>

            <span className="book-condition-option__indicator" />

          </div>

          <p className="book-condition-option__description">
            {item.description}
          </p>

        </label>
      ))}

    </div>

  </div>


  {/* DESCRIPTION */}

  <div className="book-field">
    <label className="book-field__label">
      Book description *
    </label>

    <textarea
      placeholder="Describe this book, its edition, notable details, etc."
      value={book.description}
      onChange={(e) =>
        updateBook(
          index,
          "description",
          e.target.value,
        )
      }
      rows={4}
      className="book-meta-textarea"
    />
  </div>

</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="block font-semibold text-gray-800 dark:text-white mb-2">
              Description *
            </label>

            <textarea
              placeholder="Describe the collection, condition, editions, special features, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 rounded-xl text-white font-semibold transition ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[var(--accept-color)] hover:bg-[var(--accept-color-hover)]"
            }`}
          >
            {isSubmitting
              ? "Publishing collection..."
              : "Create Collection Post"}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default CreatePostFormCollections;