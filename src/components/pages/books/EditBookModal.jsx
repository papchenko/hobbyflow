import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { db } from "../../../firebase";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "react-toastify";
import { uploadAvatar as uploadToCloudinary } from "../../utils/cloudinary";

import {
  FaTimes,
  FaPlus,
} from "react-icons/fa";

import {
  BOOK_LANGUAGES,
  BOOK_CONDITIONS,
} from "../../../constants/bookMeta";

import "../../../styles/bookMetaFields.scss";

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

const EditBookModal = ({
  book,
  onClose,
  onUpdated,
}) => {
  const { user } = useAuth();

  const [name, setName] = useState(book?.name || "");
  const [author, setAuthor] = useState(book?.author || "");
  const [genre, setGenre] = useState(book?.genre || "");
const [year, setYear] = useState(
  book?.year || "",
);

const [pages, setPages] = useState(
  book?.pages ?? "",
);

const [language, setLanguage] = useState(
  book?.language || "",
);

const [condition, setCondition] = useState(
  book?.condition || "",
);

const [price, setPrice] = useState(
  book?.price || "",
);
const [listingType, setListingType] = useState(
  book?.listingType ??
    (
      book?.isLendingAvailable ??
      Number(book?.priceLending) > 0
        ? "sale_and_rental"
        : "sale"
    )
);
  const [priceLending, setPriceLending] = useState(
  book?.priceLending ?? "",
);

const [unit, setUnit] = useState(
  book?.unit || "/ 30 Days",
);

const [isLendingAvailable, setIsLendingAvailable] =
  useState(
    book?.isLendingAvailable ??
    Number(book?.priceLending) > 0
  );
  const [description, setDescription] = useState(
    book?.description || "",
  );

  const [images, setImages] = useState(
    Array.isArray(book?.images)
      ? book.images
      : [],
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  /* --------------------------------
     IMAGE UPLOAD
  -------------------------------- */

  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    if (images.length + files.length > 6) {
      toast.error("Maximum 6 images allowed");
      return;
    }

    try {
      setIsUploading(true);

      const urls = await Promise.all(
        files.map((file) => uploadToCloudinary(file)),
      );

      setImages((prev) => [
        ...prev,
        ...urls,
      ]);

      toast.success("Images uploaded");
    } catch (error) {
      console.error(
        "Book image upload error:",
        error,
      );

      toast.error(
        "Failed to upload images",
      );
    } finally {
      setIsUploading(false);

      // дозволяє вибрати той самий файл повторно
      e.target.value = "";
    }
  };

  /* --------------------------------
     REMOVE IMAGE
  -------------------------------- */

  const removeImage = (index) => {
    if (images.length <= 3) {
      toast.error(
        "A book must have at least 3 images",
      );

      return;
    }

    setImages((prev) =>
      prev.filter((_, i) => i !== index),
    );
  };

  /* --------------------------------
     UPDATE
  -------------------------------- */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user?.uid) {
      toast.error("You must be logged in");
      return;
    }

    if (!book?.id) {
      toast.error("Book not found");
      return;
    }

    /*
      Extra ownership protection.
      Навіть якщо хтось вручну відкриє modal,
      чужу книгу змінити не можна.
    */
    if (book.sellerId !== user.uid) {
      toast.error(
        "You can only edit your own book",
      );
      return;
    }

//     if (
//   !name.trim() ||
//   !author.trim() ||
//   !genre ||
//   !year ||
//   !price ||
//   !description.trim()
// ) {
//   toast.error(
//     "Please fill all required book fields"
//   );

//   return;
// }
if (
  !name.trim() ||
  !author.trim() ||
  !genre ||
  !year ||
  !pages ||
  !language ||
  !condition ||
  (listingType !== "rental_only" && !price) ||
  !description.trim()
) {
  toast.error(
    "Please fill all required book fields",
  );

  return;
}
if (
  !Number.isInteger(Number(pages)) ||
  Number(pages) < 1 ||
  Number(pages) > 10000
) {
  toast.error(
    "Pages must be a whole number between 1 and 10,000",
  );

  return;
}

if (
  isLendingAvailable &&
  (
    !priceLending ||
    Number(priceLending) <= 0 ||
    !unit.trim()
  )
) {
  toast.error(
    "Please enter lending price and lending period",
  );

  return;
}

    if (images.length < 3) {
      toast.error(
        "A book must have at least 3 images",
      );

      return;
    }

    if (images.length > 6) {
      toast.error(
        "Maximum 6 images allowed",
      );

      return;
    }

    try {
      setIsSubmitting(true);

      const bookRef = doc(
        db,
        "books",
        book.id,
      );

      await updateDoc(bookRef, {
  name: name.trim(),
  author: author.trim(),
  genre,
  year: Number(year),
  pages: Number(pages),

  language,

  condition,

listingType,

price: listingType === "rental_only"
  ? null
  : Number(price),

isLendingAvailable: listingType !== "sale",

priceLending: listingType !== "sale"
  ? Number(priceLending)
  : null,

unit: listingType !== "sale"
  ? unit.trim()
  : null,

  description: description.trim(),
  images,

  updatedAt: serverTimestamp(),
});

      /*
        Для миттєвого оновлення UI використовуємо
        локальний Timestamp.

        У Firestore при цьому вже записаний
        serverTimestamp().
      */
      const updatedCollection = {
  ...book,

  name: name.trim(),
  author: author.trim(),
  genre,
  year: Number(year),
   pages: Number(pages),

  language,

  condition,
  price: Number(price),

  isLendingAvailable,

  priceLending: isLendingAvailable
    ? Number(priceLending)
    : null,

  unit: isLendingAvailable
    ? unit.trim()
    : null,

  description: description.trim(),
  images,

  updatedAt: Timestamp.fromDate(
    new Date()
  ),
};

      onUpdated?.(updatedCollection);

      toast.success(
        "Book updated successfully",
      );

      onClose();
    } catch (error) {
      console.error(
        "Book update error:",
        error,
      );

      toast.error(
        "Failed to update book",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="
        fixed
        inset-0
        z-[10000]
        flex
        items-center
        justify-center
        bg-black/60
        p-4
      "
      onClick={onClose}
    >
      <div
        className="
          relative
          bg-white
          dark:bg-gray-900
          rounded-2xl
          shadow-2xl
          w-full
          max-w-2xl
          max-h-[92vh]
          overflow-y-auto
          p-6
        "
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* CLOSE */}

        <button
          type="button"
          onClick={onClose}
          className="
            absolute
            top-4
            right-4
            p-2
            rounded-full
            bg-gray-100
            dark:bg-gray-700
            hover:bg-gray-200
            dark:hover:bg-gray-600
            transition
          "
        >
          <FaTimes
            className="
              w-5
              h-5
              text-gray-700
              dark:text-gray-300
            "
          />
        </button>

        {/* HEADER */}

        <div className="pr-10 mb-6">
          <h2
            className="
              text-2xl
              font-bold
              text-gray-800
              dark:text-white
            "
          >
            Edit Book
          </h2>

          <p
            className="
              text-sm
              text-gray-500
              dark:text-gray-400
              mt-1
            "
          >
            Update book information,
            images and pricing.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* BOOK INFORMATION */}

          <div>
            <h3
              className="
                font-semibold
                text-gray-800
                dark:text-white
                mb-3
              "
            >
              Book information
            </h3>

            <div className="space-y-3">
              <input
                placeholder="Name *"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="
                  w-full
                  p-3
                  border
                  rounded-lg
                  dark:bg-gray-800
                  dark:border-gray-700
                  dark:text-white
                "
              />

              <input
                placeholder="Author *"
                value={author}
                onChange={(e) =>
                  setAuthor(e.target.value)
                }
                className="
                  w-full
                  p-3
                  border
                  rounded-lg
                  dark:bg-gray-800
                  dark:border-gray-700
                  dark:text-white
                "
              />

              <select
                value={genre}
                onChange={(e) =>
                  setGenre(e.target.value)
                }
                className="
                  w-full
                  p-3
                  border
                  rounded-lg
                  dark:bg-gray-800
                  dark:border-gray-700
                  dark:text-white
                "
              >
                <option value="">
                  Select Genre *
                </option>

                {GENRES.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Year *"
                value={year}
                onChange={(e) =>
                  setYear(e.target.value)
                }
                className="
                  w-full
                  p-3
                  border
                  rounded-lg
                  dark:bg-gray-800
                  dark:border-gray-700
                  dark:text-white
                "
              />
            </div>
          </div>
          <div className="book-meta-grid">
  {/* YEAR */}
  <div className="book-field">
    <label className="book-field__label">
      Publication Year *
    </label>

    <input
      type="number"
      min="1"
      max="2100"
      placeholder="e.g. 2024"
      value={year}
      onChange={(e) =>
        setYear(e.target.value)
      }
      className="book-meta-input"
    />
  </div>

  {/* PAGES */}
  <div className="book-field">
    <label className="book-field__label">
      Number of Pages *
    </label>

    <input
      type="number"
      min="1"
      max="10000"
      placeholder="e.g. 320"
      value={pages}
      onChange={(e) =>
        setPages(e.target.value)
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
      value={language}
      onChange={(e) =>
        setLanguage(e.target.value)
      }
      className="book-meta-select"
    >
      <option value="">
        Select Language
      </option>

      {BOOK_LANGUAGES.map((item) => (
        <option
          key={item}
          value={item}
        >
          {item}
        </option>
      ))}
    </select>
  </div>
</div>
<div className="book-condition-section">
  <label className="book-field__label">
    Book Condition *
  </label>

  <div className="book-condition-grid">
    {BOOK_CONDITIONS.map((item) => (
      <label
        key={item.value}
        className={`book-condition-option ${
          condition === item.value
            ? "is-selected"
            : ""
        }`}
      >
        <input
          type="radio"
          name="bookCondition"
          value={item.value}
          checked={condition === item.value}
          onChange={(e) =>
            setCondition(e.target.value)
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

{/* PRICES */}
<div>
  <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
    Pricing
  </h3>

  <div className="space-y-3">
    {listingType !== "rental_only" && (
      <input
        type="number"
        min="0"
        placeholder="Price (₴ / UAH) *"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
      />
    )}

    <div className="space-y-2">
      <p className="font-medium text-gray-700 dark:text-gray-300">
        Selling options
      </p>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="editSellingOption"
          checked={listingType === "sale"}
          onChange={() => {
            setListingType("sale");
            setIsLendingAvailable(false);
            setPriceLending("");
            setUnit("");
          }}
        />
        <span className="text-gray-700 dark:text-gray-300">
          Sale only
        </span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="editSellingOption"
          checked={listingType === "sale_and_rental"}
          onChange={() => {
            setListingType("sale_and_rental");
            setIsLendingAvailable(true);

            if (!unit) {
              setUnit("/ 30 Days");
            }
          }}
        />
        <span className="text-gray-700 dark:text-gray-300">
          Sale + Lending
        </span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="editSellingOption"
          checked={listingType === "rental_only"}
          onChange={() => {
            setListingType("rental_only");
            setIsLendingAvailable(true);

            if (!unit) {
              setUnit("/ 30 Days");
            }
          }}
        />
        <span className="text-gray-700 dark:text-gray-300">
          Rental only
        </span>
      </label>
    </div>

    {isLendingAvailable && (
      <>
        <input
          type="number"
          min="0"
          placeholder="Lending price"
          value={priceLending}
          onChange={(e) => setPriceLending(e.target.value)}
          className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />

        <input
          placeholder="Unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </>
    )}
  </div>
</div>

          {/* IMAGES */}

          <div>
            <div
              className="
                flex
                items-center
                justify-between
                mb-3
              "
            >
              <div>
                <h3
                  className="
                    font-semibold
                    text-gray-800
                    dark:text-white
                  "
                >
                  Book images
                </h3>

                <p
                  className="
                    text-xs
                    text-gray-500
                    dark:text-gray-400
                    mt-1
                  "
                >
                  {images.length} / 6 images
                  · minimum 3
                </p>
              </div>

              {images.length < 6 && (
                <label
                  className="
                    flex
                    items-center
                    gap-2
                    px-3
                    py-2
                    rounded-lg
                    bg-[var(--primary-color)]
                    hover:bg-[var(--secondary-color-hover)]
                    text-white
                    cursor-pointer
                    transition
                    text-sm
                  "
                >
                  <FaPlus />

                  Add images

                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={
                      isUploading
                    }
                    onChange={
                      handleImagesUpload
                    }
                  />
                </label>
              )}
            </div>

            {isUploading && (
              <p
                className="
                  text-sm
                  text-gray-500
                  dark:text-gray-400
                  mb-3
                "
              >
                Uploading images...
              </p>
            )}

            <div
              className="
                grid
                grid-cols-2
                sm:grid-cols-3
                gap-3
              "
            >
              {images.map(
                (image, index) => (
                  <div
                    key={`${image}-${index}`}
                    className="
                      relative
                      aspect-[3/4]
                      rounded-lg
                      overflow-hidden
                      bg-gray-100
                      dark:bg-gray-800
                    "
                  >
                    <img
                      src={image}
                      alt={`${name} ${index + 1}`}
                      className="
                        w-full
                        h-full
                        object-cover
                      "
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeImage(index)
                      }
                      className="
                        absolute
                        top-2
                        right-2
                        w-8
                        h-8
                        rounded-full
                        bg-black/60
                        text-white
                        flex
                        items-center
                        justify-center
                        hover:bg-red-600
                        transition
                      "
                      title="Remove image"
                    >
                      <FaTimes className="text-sm" />
                    </button>

                    {index === 0 && (
                      <span
                        className="
                          absolute
                          left-2
                          bottom-2
                          px-2
                          py-1
                          rounded
                          bg-black/60
                          text-white
                          text-xs
                        "
                      >
                        Main image
                      </span>
                    )}
                  </div>
                ),
              )}
            </div>
          </div>

          {/* DESCRIPTION */}

          <div>
            <label
              className="
                block
                font-semibold
                text-gray-800
                dark:text-white
                mb-2
              "
            >
              Description *
            </label>

            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value,
                )
              }
              rows={5}
              className="
                w-full
                p-3
                border
                rounded-lg
                dark:bg-gray-800
                dark:border-gray-700
                dark:text-white
              "
            />
          </div>

          {/* SAVE */}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              isUploading
            }
            className={`
              w-full
              py-3
              rounded-xl
              text-white
              font-semibold
              flex
              items-center
              justify-center
              gap-2
              transition

              ${
                isSubmitting ||
                isUploading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[var(--accept-color)] hover:bg-[var(--accept-color-hover)]"
              }
            `}
          >

            {isSubmitting
              ? "Saving changes..."
              : "Save Changes"}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
};

export default EditBookModal;