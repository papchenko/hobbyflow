import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../../firebase";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";

import {
  FaTimes,
  FaUpload,
  FaPlus,
  FaBookOpen,
} from "react-icons/fa";

import { uploadAvatar as uploadToCloudinary } from "../../../utils/cloudinary";

import {
  BOOK_LANGUAGES,
  BOOK_CONDITIONS,
} from "../../../../constants/bookMeta";

import { COMIC_GENRES } from "../../../../constants/comicMeta";

const initialForm = {
  name: "",
  author: "",
  artist: "",
  publisher: "",
  issue: "",
  volume: "",
  year: new Date().getFullYear(),
  genre: "",
  pages: "",
  language: "",
  condition: "",
  description: "",
  price: "",
listingType: "sale",
isLendingAvailable: false,
priceLending: "",
  unit: "/ 30 Days",
};

const MAX_IMAGES = 6;
const MIN_IMAGES = 3;

export default function CreateComicModal({
  isOpen,
  onClose,
  onCreated,
}) {
  const { user, profile } = useAuth();

  const [form, setForm] = useState(initialForm);

  const [images, setImages] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setForm(initialForm);
    setImages([]);
    setLoading(false);

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleImagesUpload = async (e) => {
    const files = Array.from(
      e.target.files || []
    );

    if (!files.length) return;

    if (
      files.length + images.length >
      MAX_IMAGES
    ) {
      toast.error(
        `Maximum ${MAX_IMAGES} images allowed`
      );

      e.target.value = "";
      return;
    }

    try {
      setLoading(true);

      const uploadedUrls =
        await Promise.all(
          files.map((file) =>
            uploadToCloudinary(file)
          )
        );

      const validUrls =
        uploadedUrls.filter(Boolean);

      if (
        validUrls.length !== files.length
      ) {
        throw new Error(
          "Some images failed to upload."
        );
      }

      setImages((prev) => [
        ...prev,
        ...validUrls,
      ]);

      e.target.value = "";
    } catch (error) {
      console.error(
        "Comic image upload error:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to upload images"
      );

      e.target.value = "";
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = (index) => {
    setImages((prev) =>
      prev.filter(
        (_, imageIndex) =>
          imageIndex !== index
      )
    );
  };

  const validate = () => {
    if (!user?.uid) {
      toast.error(
        "You must be logged in"
      );

      return false;
    }

    if (!form.name.trim()) {
      toast.error(
        "Comic title is required"
      );

      return false;
    }

    if (!form.author.trim()) {
      toast.error(
        "Writer / Author is required"
      );

      return false;
    }

    if (!form.artist.trim()) {
      toast.error(
        "Artist is required"
      );

      return false;
    }

    if (!form.genre) {
      toast.error(
        "Please select a genre"
      );

      return false;
    }

    if (!form.year) {
      toast.error(
        "Publication year is required"
      );

      return false;
    }

    if (
      Number(form.year) < 1800 ||
      Number(form.year) >
        new Date().getFullYear() + 1
    ) {
      toast.error(
        "Please enter a valid publication year"
      );

      return false;
    }

    if (
      !form.pages ||
      Number(form.pages) <= 0
    ) {
      toast.error(
        "Pages must be greater than 0"
      );

      return false;
    }

    if (!form.language) {
      toast.error(
        "Please select a language"
      );

      return false;
    }

    if (!form.condition) {
      toast.error(
        "Please select comic condition"
      );

      return false;
    }

    if (
  form.listingType !== "rental_only" &&
  (
    form.price === "" ||
    Number(form.price) < 0
  )
) {
  toast.error(
    "Please enter a valid price"
  );

  return false;
}

    if (images.length < MIN_IMAGES) {
      toast.error(
        `Please upload at least ${MIN_IMAGES} images`
      );

      return false;
    }

    if (images.length > MAX_IMAGES) {
      toast.error(
        `Maximum ${MAX_IMAGES} images allowed`
      );

      return false;
    }

    if (
      form.isLendingAvailable &&
      (
        !form.priceLending ||
        Number(form.priceLending) <= 0 ||
        !form.unit.trim()
      )
    ) {
      toast.error(
        "Please enter lending price and lending period"
      );

      return false;
    }

    if (!form.description.trim()) {
      toast.error(
        "Please add a description"
      );

      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const sellerName =
        profile?.username ??
        profile?.nickname ??
        profile?.name ??
        user.displayName ??
        user.email?.split("@")[0] ??
        "User";

      const comicData = {
        type: "comic",

        name: form.name.trim(),

        author: form.author.trim(),

        artist: form.artist.trim(),

        publisher:
          form.publisher.trim(),

        issue:
          form.issue.trim(),

        volume:
          form.volume.trim(),

        year: Number(form.year),

        genre: form.genre,

        pages: Number(form.pages),

        language: form.language,

        condition: form.condition,

        description:
          form.description.trim(),

        images,

 listingType: form.listingType,

price:
  form.listingType === "rental_only"
    ? null
    : Number(form.price),

isLendingAvailable:
  form.listingType !== "sale",

priceLending:
  form.listingType !== "sale"
    ? Number(form.priceLending)
    : null,

unit:
  form.listingType !== "sale"
    ? form.unit.trim()
    : null,

        sellerId: user.uid,

        sellerName,

        sellerPhoto:
          profile?.photoURL ??
          user.photoURL ??
          null,

        rating: 0,

        ratingCount: 0,

        soldCount: 0,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp(),
      };

      const docRef =
        await addDoc(
          collection(db, "comics"),
          comicData
        );

      const createdComic = {
        id: docRef.id,
        ...comicData,
      };

      toast.success(
        "Comic posted successfully!"
      );

      onCreated?.(
        createdComic
      );

      onClose?.();
    } catch (error) {
      console.error(
        "Create comic error:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to create comic"
      );
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        bg-black
        bg-opacity-50
        p-4
      "
      onClick={() => {
        if (!loading) {
          onClose?.();
        }
      }}
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
          overflow-auto
          max-h-[90vh]
          p-6
        "
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* CLOSE BUTTON */}

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
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
            disabled:opacity-50
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

        {/* TITLE */}

        <div className="flex items-center gap-3 mb-5">
          <FaBookOpen
            className="
              text-xl
              text-[var(--accept-color)]
            "
          />

          <h2
            className="
              text-2xl
              font-bold
              text-gray-800
              dark:text-white
            "
          >
            Publish Comic
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {/* BASIC INFORMATION */}

          <div
            className="
              rounded-xl
              border
              border-gray-200
              dark:border-gray-700
              p-4
            "
          >
            <h3
              className="
                text-lg
                font-semibold
                text-gray-800
                dark:text-white
                mb-4
              "
            >
              Basic information
            </h3>

            <div className="space-y-3">
              {/* TITLE */}

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Comic title *"
                required
                className="
                  w-full
                  p-2.5
                  border
                  rounded-lg
                  bg-white
                  dark:bg-gray-800
                  dark:text-white
                  dark:border-gray-700
                "
              />

              {/* AUTHOR */}

              <input
                name="author"
                value={form.author}
                onChange={handleChange}
                placeholder="Writer / Author *"
                required
                className="
                  w-full
                  p-2.5
                  border
                  rounded-lg
                  bg-white
                  dark:bg-gray-800
                  dark:text-white
                  dark:border-gray-700
                "
              />

              {/* ARTIST */}

              <input
                name="artist"
                value={form.artist}
                onChange={handleChange}
                placeholder="Artist *"
                required
                className="
                  w-full
                  p-2.5
                  border
                  rounded-lg
                  bg-white
                  dark:bg-gray-800
                  dark:text-white
                  dark:border-gray-700
                "
              />

              {/* PUBLISHER */}

              <input
                name="publisher"
                value={form.publisher}
                onChange={handleChange}
                placeholder="Publisher"
                className="
                  w-full
                  p-2.5
                  border
                  rounded-lg
                  bg-white
                  dark:bg-gray-800
                  dark:text-white
                  dark:border-gray-700
                "
              />

              {/* ISSUE */}

              <input
                name="issue"
                value={form.issue}
                onChange={handleChange}
                placeholder="Issue (e.g. #1)"
                className="
                  w-full
                  p-2.5
                  border
                  rounded-lg
                  bg-white
                  dark:bg-gray-800
                  dark:text-white
                  dark:border-gray-700
                "
              />

              {/* VOLUME */}

              <input
                name="volume"
                value={form.volume}
                onChange={handleChange}
                placeholder="Volume (e.g. Vol. 1)"
                className="
                  w-full
                  p-2.5
                  border
                  rounded-lg
                  bg-white
                  dark:bg-gray-800
                  dark:text-white
                  dark:border-gray-700
                "
              />

              {/* GENRE */}

              <select
                name="genre"
                value={form.genre}
                onChange={handleChange}
                required
                className="
                  w-full
                  p-2.5
                  border
                  rounded-lg
                  bg-white
                  dark:bg-gray-800
                  dark:text-white
                  dark:border-gray-700
                "
              >
                <option value="">
                  Select Genre *
                </option>

                {COMIC_GENRES.map(
                  (genre) => (
                    <option
                      key={genre}
                      value={genre}
                    >
                      {genre}
                    </option>
                  )
                )}
              </select>

              {/* YEAR */}

              <div className="book-field">
                <label
                  className="
                    block
                    mb-1
                    text-sm
                    font-medium
                    text-gray-700
                    dark:text-gray-300
                  "
                >
                  Publication Year *
                </label>

                <input
                  type="number"
                  name="year"
                  min="1800"
                  max={
                    new Date().getFullYear() +
                    1
                  }
                  value={form.year}
                  onChange={handleChange}
                  placeholder="e.g. 2024"
                  required
                  className="
                    w-full
                    p-2.5
                    border
                    rounded-lg
                    bg-white
                    dark:bg-gray-800
                    dark:text-white
                    dark:border-gray-700
                  "
                />
              </div>

              {/* PAGES */}

              <div className="book-field">
                <label
                  className="
                    block
                    mb-1
                    text-sm
                    font-medium
                    text-gray-700
                    dark:text-gray-300
                  "
                >
                  Number of Pages *
                </label>

                <input
                  type="number"
                  name="pages"
                  min="1"
                  max="10000"
                  value={form.pages}
                  onChange={handleChange}
                  placeholder="e.g. 48"
                  required
                  className="
                    w-full
                    p-2.5
                    border
                    rounded-lg
                    bg-white
                    dark:bg-gray-800
                    dark:text-white
                    dark:border-gray-700
                  "
                />
              </div>

              {/* LANGUAGE */}

              <div className="book-field">
                <label
                  className="
                    block
                    mb-1
                    text-sm
                    font-medium
                    text-gray-700
                    dark:text-gray-300
                  "
                >
                  Language *
                </label>

                <select
                  name="language"
                  value={form.language}
                  onChange={handleChange}
                  required
                  className="
                    w-full
                    p-2.5
                    border
                    rounded-lg
                    bg-white
                    dark:bg-gray-800
                    dark:text-white
                    dark:border-gray-700
                  "
                >
                  <option value="">
                    Select Language
                  </option>

                  {BOOK_LANGUAGES.map(
                    (language) => (
                      <option
                        key={language}
                        value={language}
                      >
                        {language}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* CONDITION */}

          <div
            className="
              rounded-xl
              border
              border-gray-200
              dark:border-gray-700
              p-4
            "
          >
            <label
              className="
                block
                mb-3
                text-sm
                font-medium
                text-gray-700
                dark:text-gray-300
              "
            >
              Comic Condition *
            </label>

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                gap-3
              "
            >
              {BOOK_CONDITIONS.map(
                (item) => (
                  <label
                    key={item.value}
                    className={`
                      relative
                      block
                      p-3
                      rounded-xl
                      border
                      cursor-pointer
                      transition-all
                      ${
                        form.condition ===
                        item.value
                          ? "border-[var(--accept-color)] bg-[var(--accept-color)]/10"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                      }
                    `}
                  >
                    <input
                      type="radio"
                      name="comicCondition"
                      value={item.value}
                      checked={
                        form.condition ===
                        item.value
                      }
                      onChange={(e) =>
                        setForm(
                          (prev) => ({
                            ...prev,
                            condition:
                              e.target
                                .value,
                          })
                        )
                      }
                      className="sr-only"
                    />

                    <div className="flex items-center justify-between">
                      <span
                        className="
                          font-semibold
                          text-gray-800
                          dark:text-white
                        "
                      >
                        {item.label}
                      </span>

                      <span
                        className={`
                          w-4
                          h-4
                          rounded-full
                          border-2
                          ${
                            form.condition ===
                            item.value
                              ? "border-[var(--accept-color)] bg-[var(--accept-color)]"
                              : "border-gray-400"
                          }
                        `}
                      />
                    </div>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-gray-500
                        dark:text-gray-400
                      "
                    >
                      {item.description}
                    </p>
                  </label>
                )
              )}
            </div>
          </div>

{/* PRICE */}

<div
  className="
    rounded-xl
    border
    border-gray-200
    dark:border-gray-700
    p-4
  "
>
  <h3
    className="
      text-lg
      font-semibold
      text-gray-800
      dark:text-white
      mb-3
    "
  >
    Pricing
  </h3>

  {form.listingType !== "rental_only" && (
    <input
      type="number"
      name="price"
      min="0"
      step="0.01"
      value={form.price}
      onChange={handleChange}
      placeholder="Sale Price (₴ / UAH) *"
      required
      className="
        w-full
        p-2.5
        border
        rounded-lg
        bg-white
        dark:bg-gray-800
        dark:text-white
        dark:border-gray-700
      "
    />
  )}

  <div className="mt-4 space-y-2">
    <p className="font-medium text-gray-700 dark:text-gray-300">
      Selling options
    </p>

    <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
      <input
        type="radio"
        name="comicSellingOption"
        checked={form.listingType === "sale"}
        onChange={() =>
          setForm((prev) => ({
            ...prev,
            listingType: "sale",
            isLendingAvailable: false,
            priceLending: "",
            unit: "",
          }))
        }
      />
      <span>Sale only</span>
    </label>

    <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
      <input
        type="radio"
        name="comicSellingOption"
        checked={form.listingType === "sale_and_rental"}
        onChange={() =>
          setForm((prev) => ({
            ...prev,
            listingType: "sale_and_rental",
            isLendingAvailable: true,
            unit: prev.unit || "/ 30 Days",
          }))
        }
      />
      <span>Sale + Lending</span>
    </label>

    <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
      <input
        type="radio"
        name="comicSellingOption"
        checked={form.listingType === "rental_only"}
        onChange={() =>
          setForm((prev) => ({
            ...prev,
            listingType: "rental_only",
            isLendingAvailable: true,
            unit: prev.unit || "/ 30 Days",
          }))
        }
      />
      <span>Rental only</span>
    </label>
  </div>

  {form.isLendingAvailable && (
    <div className="mt-3 space-y-3">
      <input
        type="number"
        name="priceLending"
        min="0"
        step="0.01"
        value={form.priceLending}
        onChange={handleChange}
        placeholder="Lending Price *"
        className="
          w-full
          p-2.5
          border
          rounded-lg
          bg-white
          dark:bg-gray-800
          dark:text-white
          dark:border-gray-700
        "
      />

      <input
        name="unit"
        value={form.unit}
        onChange={handleChange}
        placeholder="Lending Period *"
        className="
          w-full
          p-2.5
          border
          rounded-lg
          bg-white
          dark:bg-gray-800
          dark:text-white
          dark:border-gray-700
        "
      />
    </div>
  )}
</div>

          {/* DESCRIPTION */}

          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the comic, edition, story, special features..."
            rows={5}
            required
            className="
              w-full
              p-2.5
              border
              rounded-lg
              bg-white
              dark:bg-gray-800
              dark:text-white
              dark:border-gray-700
            "
          />

          {/* IMAGES */}

          <div>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <p
                  className="
                    font-medium
                    text-gray-700
                    dark:text-gray-300
                  "
                >
                  Comic Images *
                </p>

                <p
                  className="
                    text-xs
                    text-gray-500
                    dark:text-gray-400
                  "
                >
                  {images.length}/
                  {MAX_IMAGES} images
                  selected
                </p>
              </div>

              <label
                className="
                  flex
                  items-center
                  gap-2
                  cursor-pointer
                  px-3
                  py-2
                  rounded-lg
                  bg-gray-100
                  dark:bg-gray-700
                  hover:bg-gray-200
                  dark:hover:bg-gray-600
                  text-gray-700
                  dark:text-gray-200
                  transition
                "
              >
                <FaUpload />

                <span>
                  Add images
                </span>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={
                    handleImagesUpload
                  }
                  disabled={
                    loading ||
                    images.length >=
                      MAX_IMAGES
                  }
                  hidden
                />
              </label>
            </div>

            {images.length > 0 && (
              <div
                className="
                  grid
                  grid-cols-3
                  gap-2
                  mt-3
                "
              >
                {images.map(
                  (img, idx) => (
                    <div
                      key={`${img}-${idx}`}
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
                        alt={`Comic image ${
                          idx + 1
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
                          handleRemoveImage(
                            idx
                          )
                        }
                        disabled={
                          loading
                        }
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
                          disabled:opacity-50
                        "
                        title="Remove image"
                        aria-label={`Remove image ${
                          idx + 1
                        }`}
                      >
                        <FaTimes className="text-xs" />
                      </button>

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

                      {idx === 0 && (
                        <span
                          className="
                            absolute
                            top-1.5
                            left-1.5
                            px-2
                            py-0.5
                            rounded-full
                            bg-[var(--accept-color)]
                            text-white
                            text-[10px]
                            font-semibold
                          "
                        >
                          Main
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              flex
              items-center
              justify-center
              gap-2
              bg-[var(--accept-color)]
              hover:bg-[var(--accept-color-hover)]
              disabled:opacity-50
              disabled:cursor-not-allowed
              text-white
              py-2.5
              rounded-lg
              transition
            "
          >
            {loading ? (
              "Publishing..."
            ) : (
              <>
                <FaPlus />

                Publish Comic
              </>
            )}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}