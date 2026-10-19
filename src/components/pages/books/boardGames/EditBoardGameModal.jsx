
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { db } from "../../../../firebase";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "react-toastify";

import { uploadAvatar as uploadToCloudinary } from "../../../utils/cloudinary";

import {
  FaTimes,
  FaPlus,
} from "react-icons/fa";

import {
  BOARD_GAME_CATEGORIES,
  BOARD_GAME_LANGUAGES,
  BOARD_GAME_CONDITIONS,
  BOARD_GAME_COMPLETENESS,
  getBoardGameListingType,
} from "../../../../constants/boardGameMeta";

import "../../../../styles/bookMetaFields.scss";

const EditBoardGameModal = ({
  game,
  onClose,
  onUpdated,
}) => {
  const { user } = useAuth();

  const [name, setName] = useState(game?.name || "");
  const [author, setAuthor] = useState(game?.author || "");
  const [publisher, setPublisher] = useState(game?.publisher || "");
  const [category, setCategory] = useState(game?.category || "");

  const [year, setYear] = useState(game?.year ?? "");

  const [minPlayers, setMinPlayers] = useState(
    game?.minPlayers ?? ""
  );

  const [maxPlayers, setMaxPlayers] = useState(
    game?.maxPlayers ?? ""
  );

  const [playTime, setPlayTime] = useState(
    game?.playTime ?? ""
  );

  const [minAge, setMinAge] = useState(
    game?.minAge ?? ""
  );

  const [language, setLanguage] = useState(
    game?.language || ""
  );

  const [condition, setCondition] = useState(
    game?.condition || ""
  );

  const [completeness, setCompleteness] = useState(
    game?.completeness || ""
  );

  const [listingType, setListingType] = useState(
    getBoardGameListingType(game)
  );

  const [price, setPrice] = useState(
    game?.price ?? ""
  );

  const [priceLending, setPriceLending] = useState(
    game?.priceLending ?? ""
  );

  const [unit, setUnit] = useState(
    game?.unit || "/ 30 Days"
  );

  const [description, setDescription] = useState(
    game?.description || ""
  );

  const [images, setImages] = useState(
    Array.isArray(game?.images) ? game.images : []
  );

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLendingAvailable = listingType !== "sale";
  const isRentalOnly = listingType === "rental_only";

  const isCurrentlyRented =
    game?.isCurrentlyRented === true ||
    Boolean(game?.activeRentalOrderId);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const handleImagesUpload = async (e) => {
    const files = Array.from(e.target.files || []);

    if (!files.length) return;

    if (images.length + files.length > 6) {
      toast.error("Maximum 6 images allowed");
      e.target.value = "";
      return;
    }

    if (files.some((file) => !file.type.startsWith("image/"))) {
      toast.error("Only image files are allowed");
      e.target.value = "";
      return;
    }

    try {
      setIsUploading(true);

      const urls = await Promise.all(
        files.map((file) => uploadToCloudinary(file))
      );

      if (urls.some((url) => typeof url !== "string" || !url)) {
        throw new Error("Invalid image upload result");
      }

      setImages((prev) => [...prev, ...urls]);

      toast.success("Images uploaded");
    } catch (error) {
      console.error("Board game image upload error:", error);
      toast.error("Failed to upload images");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index) => {
    if (images.length <= 3) {
      toast.error("A board game must have at least 3 images");
      return;
    }

    setImages((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting || isUploading) return;

    if (!user?.uid) {
      toast.error("You must be logged in");
      return;
    }

    if (!game?.id) {
      toast.error("Board game not found");
      return;
    }

    if (game.sellerId !== user.uid) {
      toast.error("You can only edit your own board game");
      return;
    }

    if (
      !name.trim() ||
      !author.trim() ||
      !publisher.trim() ||
      !category ||
      !year ||
      !minPlayers ||
      !maxPlayers ||
      !playTime ||
      minAge === "" ||
      !language ||
      !condition ||
      !completeness ||
      !description.trim()
    ) {
      toast.error("Please fill all required board game fields");
      return;
    }

    const currentYear = new Date().getFullYear();

    if (
      !Number.isInteger(Number(year)) ||
      Number(year) < 1900 ||
      Number(year) > currentYear + 1
    ) {
      toast.error("Please enter a valid publication year");
      return;
    }

    if (
      !Number.isInteger(Number(minPlayers)) ||
      !Number.isInteger(Number(maxPlayers)) ||
      Number(minPlayers) < 1 ||
      Number(maxPlayers) < Number(minPlayers) ||
      Number(maxPlayers) > 100
    ) {
      toast.error("Please enter a valid player range");
      return;
    }

    if (
      !Number.isInteger(Number(playTime)) ||
      Number(playTime) < 1 ||
      Number(playTime) > 10000
    ) {
      toast.error("Please enter a valid playing time");
      return;
    }

    if (
      !Number.isInteger(Number(minAge)) ||
      Number(minAge) < 0 ||
      Number(minAge) > 100
    ) {
      toast.error("Please enter a valid recommended age");
      return;
    }

    if (
      !isRentalOnly &&
      (
        price === "" ||
        !Number.isFinite(Number(price)) ||
        Number(price) <= 0
      )
    ) {
      toast.error("Please enter a valid selling price");
      return;
    }

    if (
      isLendingAvailable &&
      (
        priceLending === "" ||
        !Number.isFinite(Number(priceLending)) ||
        Number(priceLending) <= 0 ||
        !unit.trim()
      )
    ) {
      toast.error("Please enter a valid rental price and period");
      return;
    }

    if (images.length < 3 || images.length > 6) {
      toast.error("Please keep 3–6 images");
      return;
    }

    try {
      setIsSubmitting(true);

      const gameRef = doc(db, "boardGames", game.id);
      const gameSnap = await getDoc(gameRef);

      if (!gameSnap.exists()) {
        toast.error("Board game no longer exists");
        return;
      }

      const currentData = gameSnap.data();

      if (currentData.sellerId !== user.uid) {
        toast.error("You cannot edit this board game");
        return;
      }

      const currentlyRented =
        currentData.isCurrentlyRented === true ||
        Boolean(currentData.activeRentalOrderId);

      if (currentlyRented) {
        toast.error(
          "This board game is currently rented. Editing is unavailable until it is returned."
        );
        return;
      }

      const updates = {
        name: name.trim(),
        author: author.trim(),
        publisher: publisher.trim(),
        category,
        year: Number(year),

        minPlayers: Number(minPlayers),
        maxPlayers: Number(maxPlayers),
        playTime: Number(playTime),
        minAge: Number(minAge),

        language,
        condition,
        completeness,

        listingType,

        price: isRentalOnly ? null : Number(price),

        isLendingAvailable,

        priceLending: isLendingAvailable
          ? Number(priceLending)
          : null,

        unit: isLendingAvailable ? unit.trim() : null,

        description: description.trim(),
        images,

        updatedAt: serverTimestamp(),
      };

      await updateDoc(gameRef, updates);

      const updatedGame = {
        ...game,
        ...updates,
        updatedAt: Timestamp.now(),
      };

      onUpdated?.(updatedGame);

      toast.success("Board game updated successfully");
      onClose?.();
    } catch (error) {
      console.error("Board game update error:", error);
      toast.error("Failed to update board game");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-white border-gray-300 dark:border-gray-600";

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          <FaTimes className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <h2 className="text-2xl font-bold mb-5 text-gray-800 dark:text-white pr-10">
          Edit Board Game
        </h2>

        {isCurrentlyRented && (
          <p className="mb-4 text-sm font-medium text-red-600 dark:text-red-400">
            This board game is currently rented. Changes cannot be saved until it is returned.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Game Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            maxLength={150}
          />
          <input
            type="text"
            placeholder="Game Designer / Author *"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className={inputClass}
            maxLength={150}
            required
          />
          <input
            placeholder="Publisher *"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            className={inputClass}
            maxLength={150}
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            <option value="">Select Category *</option>
            {BOARD_GAME_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <div className="book-meta-grid">
            <div className="book-field book-field--full">
              <label className="book-field__label">
                Publication Year *
              </label>
              <input
                type="number"
                min="1900"
                max={new Date().getFullYear() + 1}
                placeholder="e.g. 2024"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="book-meta-input"
              />
            </div>

            <div className="book-field">
              <label className="book-field__label">
                Minimum Players *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={minPlayers}
                onChange={(e) => setMinPlayers(e.target.value)}
                className="book-meta-input"
              />
            </div>

            <div className="book-field">
              <label className="book-field__label">
                Maximum Players *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                className="book-meta-input"
              />
            </div>

            <div className="book-field">
              <label className="book-field__label">
                Playing Time (minutes) *
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                value={playTime}
                onChange={(e) => setPlayTime(e.target.value)}
                className="book-meta-input"
              />
            </div>

            <div className="book-field">
              <label className="book-field__label">
                Recommended Age *
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                className="book-meta-input"
              />
            </div>

            <div className="book-field book-field--full">
              <label className="book-field__label">
                Language *
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="book-meta-select"
              >
                <option value="">Select Language</option>
                {BOARD_GAME_LANGUAGES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="book-condition-section">
            <label className="book-field__label">
              Game Condition *
            </label>

            <div className="book-condition-grid">
              {BOARD_GAME_CONDITIONS.map((item) => (
                <label
                  key={item.value}
                  className={`book-condition-option ${
                    condition === item.value ? "is-selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="editBoardGameCondition"
                    value={item.value}
                    checked={condition === item.value}
                    onChange={(e) => setCondition(e.target.value)}
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

          <div className="book-condition-section">
            <label className="book-field__label">
              Components Completeness *
            </label>

            <div className="book-condition-grid">
              {BOARD_GAME_COMPLETENESS.map((item) => (
                <label
                  key={item.value}
                  className={`book-condition-option ${
                    completeness === item.value ? "is-selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="editBoardGameCompleteness"
                    value={item.value}
                    checked={completeness === item.value}
                    onChange={(e) => setCompleteness(e.target.value)}
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

          <div className="space-y-2">
            <p className="font-medium text-gray-700 dark:text-gray-300">
              Selling options
            </p>

            {[
              { value: "sale", label: "Sale only" },
              { value: "sale_and_rental", label: "Sale and rental" },
              { value: "rental_only", label: "Rental only" },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300"
              >
                <input
                  type="radio"
                  name="editBoardGameListingType"
                  checked={listingType === option.value}
                  onChange={() => setListingType(option.value)}
                  disabled={isCurrentlyRented}
                />
                {option.label}
              </label>
            ))}
          </div>

          {!isRentalOnly && (
            <input
              placeholder="Price (₴ / UAH) *"
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClass}
            />
          )}

          {isLendingAvailable && (
            <div className="space-y-3">
              <input
                placeholder="Rental Price (₴ / UAH) *"
                type="number"
                min="0.01"
                step="0.01"
                value={priceLending}
                onChange={(e) => setPriceLending(e.target.value)}
                className={inputClass}
              />

              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={inputClass}
              >
                <option value="/ 1 Day">1 Day</option>
                <option value="/ 7 Days">7 Days</option>
                <option value="/ 14 Days">14 Days</option>
                <option value="/ 30 Days">30 Days</option>
              </select>
            </div>
          )}

          <textarea
            placeholder="Game description, rules, included components, defects... *"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            maxLength={5000}
            className={inputClass}
          />

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Game Photos (3–6) *
            </label>

            <label className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer text-gray-700 dark:text-gray-300 hover:border-[var(--primary-color)] transition">
              <FaPlus />
              Add Photos

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImagesUpload}
                disabled={isUploading || images.length >= 6}
                className="hidden"
              />
            </label>

            {isUploading && (
              <p className="text-sm text-gray-500">
                Uploading images...
              </p>
            )}

            <div className="grid grid-cols-3 gap-3">
              {images.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="relative"
                >
                  <img
                    src={image}
                    alt={`Board game ${index + 1}`}
                    className="w-full h-28 object-cover rounded-lg"
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {images.length}/6 photos
            </p>
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              isUploading ||
              isCurrentlyRented
            }
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[var(--primary-color)] text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EditBoardGameModal;
