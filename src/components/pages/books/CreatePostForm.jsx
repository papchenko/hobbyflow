import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import { uploadAvatar as uploadToCloudinary } from '../../utils/cloudinary';
import {
  FaTimes
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
  "Comics"
];

const CreatePostForm = ({ onClose }) => {
  const { user, userProfile } = useAuth();
  const [name, setName] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState("");
  const [pages, setPages] = useState("");
  const [language, setLanguage] = useState("");
  const [condition, setCondition] = useState("");
  const [price, setPrice] = useState("");
  const [priceLending, setPriceLending] = useState('');
  const [unit, setUnit] = useState('/ 30 Days');
  const [isLendingAvailable, setIsLendingAvailable] = useState(false);
  const [listingType, setListingType] = useState("sale");
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 6) {
      toast.error("Maximum 6 images allowed");
      return;
    }
    const urls = await Promise.all(files.map(f => uploadToCloudinary(f)));
    setImages(prev => [...prev, ...urls]);
  };

  const handleRemoveImage = (index) => {
  setImages((prev) =>
    prev.filter((_, imageIndex) => imageIndex !== index)
  );
};

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!user?.uid) {
    toast.error("You must be logged in");
    return;
  }

  if (!userProfile) {
    toast.error("User profile is not loaded yet");
    return;
  }

if (
  !name.trim() ||
  !author.trim() ||
  !genre ||
  !year ||
  !pages ||
  !language ||
  !condition ||
  (listingType !== "rental_only" && !price) ||
  images.length < 3 ||
  !description.trim()
) {
  toast.error(
    "Please fill all required fields and add 3–6 images"
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
      "Please enter lending price and lending period"
    );
    return;
  }

  try {
    await addDoc(collection(db, "books"), {
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

      sellerId: user.uid,

      sellerName:
        userProfile?.name ?? "",

      sellerPhoto:
        userProfile?.photoURL ?? null,

      rating: 0,
      ratingCount: 0,
      soldCount: 0,

      createdAt:
        serverTimestamp(),
    });

    toast.success("Book posted!");

    onClose();
  } catch (error) {
    console.error(
      "Create book error:",
      error
    );

    toast.error(
      error?.message ||
      "Failed to create book"
    );
  }
};

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-auto max-h-[90vh] p-6" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition">
          <FaTimes className="w-5 h-5 text-gray-700 dark:text-gray-300"/>
        </button>
        <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Create Book Post</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded"/>
          <input placeholder="Author" value={author} onChange={e => setAuthor(e.target.value)} className="w-full p-2 border rounded"/>
          
          {/* Select Genre */}
          <select value={genre} onChange={e => setGenre(e.target.value)} className="w-full p-2 border rounded">
            <option value="">Select Genre</option>
            {GENRES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>

          <div className="book-meta-grid">
  {/* YEAR */}
  <div className="book-field book-field--full">
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
  <div className="book-field">
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

{listingType !== "rental_only" && (
  <input
    placeholder="Price (₴ / UAH)"
    type="number"
    min="0"
    value={price}
    onChange={(e) => setPrice(e.target.value)}
    className="w-full p-2 border rounded"
  />
)}

<div className="space-y-2">
  <p className="font-medium text-gray-700 dark:text-gray-300">
    Selling options
  </p>

  <label className="flex items-center gap-2 cursor-pointer">
    <input
      type="radio"
      name="sellingOption"
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
      name="sellingOption"
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
      name="sellingOption"
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
      placeholder="Lending Price"
      type="number"
      min="0"
      value={priceLending}
      onChange={(e) => setPriceLending(e.target.value)}
      className="w-full p-2 border rounded"
    />

    <input
      placeholder="Unit"
      value={unit}
      onChange={(e) => setUnit(e.target.value)}
      className="w-full p-2 border rounded"
    />
  </>
)}
          <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded"/>
          <input type="file" multiple onChange={handleImagesUpload} className="w-full"/>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
  {images.length}/6 - (max) images selected
</p>
{images.length > 0 && (
  <div className="grid grid-cols-3 gap-2 mt-3">
    {images.map((img, idx) => (
      <div
        key={idx}
        className="
          relative
          group
          w-full
          h-24
          rounded-xl
          overflow-hidden
          border
          border-gray-200
          dark:border-gray-700
          bg-gray-100
          dark:bg-gray-800
        "
      >
        <img
          src={img}
          alt={`Book image ${idx + 1}`}
          className="
            w-full
            h-full
            object-cover
          "
        />

        {/* DELETE BUTTON */}

        <button
          type="button"
          onClick={() => handleRemoveImage(idx)}
          className="
            absolute
            top-1.5
            right-1.5
            w-7
            h-7
            flex
            items-center
            justify-center
            rounded-full
            bg-black/70
            text-white
            opacity-100
            md:opacity-0
            md:group-hover:opacity-100
            hover:bg-red-600
            transition-all
            duration-200
            shadow-md
          "
          title="Remove image"
          aria-label={`Remove image ${idx + 1}`}
        >
          <FaTimes className="text-xs" />
        </button>

        {/* IMAGE NUMBER */}

        <span
          className="
            absolute
            bottom-1.5
            left-1.5
            px-2
            py-0.5
            rounded-full
            bg-black/60
            text-white
            text-[10px]
            font-semibold
          "
        >
          {idx + 1}
        </span>
      </div>
    ))}
  </div>
)}
          <button type="submit" className="w-full bg-[var(--accept-color)] hover:[var(--accept-color-hover)] text-white py-2 rounded">Create Post</button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default CreatePostForm;