import { useRef, useState } from "react";

import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import {
  FaImage,
  FaPlus,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

import { toast } from "react-toastify";

import { db } from "../../../firebase";
import { useAuth } from "../../../context/AuthContext";

import { uploadToCloudinary } from "../../utils/cloudinary";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// const CATEGORIES = [
//   "BookFlow News",
//   "Books",
//   "Collecting",
//   "Trading",
//   "Community",
//   "Tips",
// ];
const CATEGORIES = [
  "BookFlow News"
];

const INITIAL_FORM = {
  title: "",
  category: "BookFlow News",
  excerpt: "",
  content: "",
  featured: false,
};

export default function AdminNewsForm() {
  const { user, userProfile } = useAuth();

  const fileInputRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [saving, setSaving] = useState(false);

  const isAdmin = userProfile?.role === "admin";

  if (!isAdmin) {
    return null;
  }

  function handleChange(event) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  function handleImageSelect(event) {
    const files = Array.from(
      event.target.files || [],
    );

    if (!files.length) {
      return;
    }

    const remainingSlots =
      MAX_IMAGES - selectedFiles.length;

    if (remainingSlots <= 0) {
      toast.error(
        `You can add up to ${MAX_IMAGES} images.`,
      );

      event.target.value = "";
      return;
    }

    const filesToAdd = files.slice(
      0,
      remainingSlots,
    );

    const validFiles = [];

    for (const file of filesToAdd) {
      if (!file.type.startsWith("image/")) {
        toast.error(
          `${file.name} is not an image.`,
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        toast.error(
          `${file.name} is larger than 10 MB.`,
        );
        continue;
      }

      validFiles.push(file);
    }

    if (!validFiles.length) {
      event.target.value = "";
      return;
    }

    const newPreviews = validFiles.map((file) =>
      URL.createObjectURL(file),
    );

    setSelectedFiles((prev) => [
      ...prev,
      ...validFiles,
    ]);

    setPreviews((prev) => [
      ...prev,
      ...newPreviews,
    ]);

    event.target.value = "";
  }

  function removeImage(index) {
    setSelectedFiles((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );

    setPreviews((prev) => {
      const previewToRemove = prev[index];

      if (previewToRemove) {
        URL.revokeObjectURL(previewToRemove);
      }

      return prev.filter(
        (_, itemIndex) => itemIndex !== index,
      );
    });
  }

  function clearImages() {
    previews.forEach((preview) => {
      URL.revokeObjectURL(preview);
    });

    setSelectedFiles([]);
    setPreviews([]);
  }

  function resetForm() {
    setForm(INITIAL_FORM);
    clearImages();
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isAdmin || saving) {
      return;
    }

    const title = form.title.trim();
    const excerpt = form.excerpt.trim();
    const content = form.content.trim();

    if (!title) {
      toast.error("Please enter a news title.");
      return;
    }

    if (!content) {
      toast.error(
        "Please enter the article content.",
      );
      return;
    }

    try {
      setSaving(true);

      let imageUrls = [];

      if (selectedFiles.length) {
        imageUrls = await Promise.all(
          selectedFiles.map((file) =>
            uploadToCloudinary(file, {
              folder: "bookflow_news",
              public_id_prefix: "news",
              tags: ["bookflow", "club", "news"],
              returnType: "secure_url",
            }),
          ),
        );
      }

      await addDoc(
        collection(db, "bookClubNews"),
        {
          title,
          category: form.category,
          excerpt,
          content,

          images: imageUrls,

          // Backward compatibility
          // with old NewsCard / NewsDetails.
          coverImage: imageUrls[0] || "",

          featured: form.featured,

          authorId: user.uid,

          authorName:
            userProfile?.name ||
            user.displayName ||
            "BookFlow Team",

          published: true,

          views: 0,

          createdAt:
            serverTimestamp(),

          updatedAt:
            serverTimestamp(),

          updatedById: user.uid,

          updatedByName:
            userProfile?.name ||
            user.displayName ||
            "BookFlow Team",
        },
      );

      resetForm();
      setOpen(false);

      toast.success(
        "News article published.",
      );
    } catch (error) {
      console.error(
        "Failed to create news:",
        error,
      );

      toast.error(
        "Failed to publish the article. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <section className="admin-publisher">
        <div className="admin-publisher__info">
          <span>ADMIN</span>

          <div>
            <h2>Publish news</h2>

            <p>
              Create a new article for the
              BookFlow Club.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="admin-publisher__toggle"
          onClick={() => setOpen(true)}
        >
          <FaPlus />

          <span>New article</span>
        </button>
      </section>
    );
  }

  return (
    <section className="admin-publisher admin-publisher--open">
      <div className="admin-publisher__top">
        <div>
          <span>ADMIN</span>

          <h2>Publish news</h2>

          <p>
            Create and publish a new BookFlow
            Club article.
          </p>
        </div>

        <button
          type="button"
          className="admin-publisher__close"
          onClick={() => {
            resetForm();
            setOpen(false);
          }}
          aria-label="Close form"
        >
          <FaTimes />
        </button>
      </div>

      <form
        className="admin-news-form"
        onSubmit={handleSubmit}
      >
        <div className="admin-news-form__grid">
          <div className="admin-news-form__field admin-news-form__field--full">
            <label htmlFor="news-title">
              Title
            </label>

            <input
              id="news-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Article title"
              maxLength={160}
              required
            />
          </div>

          <div className="admin-news-form__field">
            <label htmlFor="news-category">
              Category
            </label>

            {/* select */}
            <div
              id="news-category"
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              {CATEGORIES.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ),
              )}
            </div>
          </div>

          <div className="admin-news-form__field admin-news-form__field--full">
            <label>
              Images
              <span className="admin-news-form__hint">
                {" "}
                ({selectedFiles.length}/{MAX_IMAGES})
              </span>
            </label>

            <div className="admin-news-form__upload">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleImageSelect}
              />

              <button
                type="button"
                className="admin-news-form__upload-button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={
                  selectedFiles.length >=
                  MAX_IMAGES
                }
              >
                <FaImage />

                <span>
                  {selectedFiles.length >=
                  MAX_IMAGES
                    ? "Maximum 5 images"
                    : "Choose images"}
                </span>
              </button>

              <p>
                JPG, PNG, WEBP · maximum 5
                images · 10 MB per image
              </p>
            </div>

            {previews.length > 0 && (
              <div className="admin-news-form__previews">
                {previews.map(
                  (preview, index) => (
                    <div
                      className="admin-news-form__preview"
                      key={preview}
                    >
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                      />

                      <span>
                        {index + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeImage(index)
                        }
                        aria-label={`Remove image ${
                          index + 1
                        }`}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          <div className="admin-news-form__field admin-news-form__field--full">
            <label htmlFor="news-excerpt">
              Excerpt
            </label>

            <textarea
              id="news-excerpt"
              name="excerpt"
              value={form.excerpt}
              onChange={handleChange}
              placeholder="Short article introduction..."
              rows={3}
              maxLength={400}
            />
          </div>

          <div className="admin-news-form__field admin-news-form__field--full">
            <label htmlFor="news-content">
              Content
            </label>

            <textarea
              id="news-content"
              name="content"
              value={form.content}
              onChange={handleChange}
              placeholder="Write the full article..."
              rows={12}
              required
            />
          </div>
        </div>

        <label className="admin-news-form__checkbox">
          <input
            type="checkbox"
            name="featured"
            checked={form.featured}
            onChange={handleChange}
          />

          <span>
            Mark this article as featured
          </span>
        </label>

        <div className="admin-news-form__actions">
          <button
            type="button"
            className="admin-news-form__cancel"
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="admin-news-form__submit"
            disabled={
              saving ||
              !form.title.trim() ||
              !form.content.trim()
            }
          >
            {saving
              ? "Publishing..."
              : "Publish article"}
          </button>
        </div>
      </form>
    </section>
  );
}