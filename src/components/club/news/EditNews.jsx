import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  FaArrowLeft,
  FaImage,
  FaPlus,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

import { toast } from "react-toastify";

import { db } from "../../../firebase";
import { useAuth } from "../../../context/AuthContext";

import { uploadToCloudinary } from "../../utils/cloudinary";

import "./news.scss";

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const CATEGORIES = [
  "BookFlow News",
  "Books",
  "Collecting",
  "Trading",
  "Community",
  "Tips",
];

export default function EditNews() {
  const { newsId } = useParams();
  const navigate = useNavigate();

  const {
    user,
    userProfile,
    loading: authLoading,
  } = useAuth();

  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    category: "BookFlow News",
    excerpt: "",
    content: "",
    featured: false,
  });

  const [existingImages, setExistingImages] =
    useState([]);

  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] =
    useState([]);

  const isAdmin =
    userProfile?.role === "admin";

  useEffect(() => {
    async function loadNews() {
      if (!newsId) {
        return;
      }

      try {
        setLoading(true);

        const newsRef = doc(
          db,
          "bookClubNews",
          newsId,
        );

        const snapshot =
          await getDoc(newsRef);

        if (!snapshot.exists()) {
          toast.error("News not found.");
          navigate("/club/news");
          return;
        }

        const data = snapshot.data();

        const images =
          Array.isArray(data.images) &&
          data.images.length > 0
            ? data.images
            : data.coverImage
              ? [data.coverImage]
              : [];

        setForm({
          title: data.title || "",
          category:
            data.category ||
            "BookFlow News",
          excerpt: data.excerpt || "",
          content: data.content || "",
          featured:
            data.featured === true,
        });

        setExistingImages(images);
      } catch (error) {
        console.error(
          "Failed to load news:",
          error,
        );

        toast.error(
          "Failed to load the article.",
        );
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading && isAdmin) {
      loadNews();
    } else if (!authLoading && !isAdmin) {
      setLoading(false);
    }
  }, [
    newsId,
    authLoading,
    isAdmin,
    navigate,
  ]);

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

    const currentCount =
      existingImages.length +
      newFiles.length;

    const remainingSlots =
      MAX_IMAGES - currentCount;

    if (remainingSlots <= 0) {
      toast.error(
        `You can have up to ${MAX_IMAGES} images.`,
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

    const previews = validFiles.map(
      (file) => URL.createObjectURL(file),
    );

    setNewFiles((prev) => [
      ...prev,
      ...validFiles,
    ]);

    setNewPreviews((prev) => [
      ...prev,
      ...previews,
    ]);

    event.target.value = "";
  }

  function removeExistingImage(index) {
    setExistingImages((prev) =>
      prev.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    );
  }

  function removeNewImage(index) {
    setNewFiles((prev) =>
      prev.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      ),
    );

    setNewPreviews((prev) => {
      const previewToRemove =
        prev[index];

      if (previewToRemove) {
        URL.revokeObjectURL(
          previewToRemove,
        );
      }

      return prev.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      );
    });
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
      toast.error(
        "Please enter a news title.",
      );
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

      let uploadedUrls = [];

      if (newFiles.length > 0) {
        uploadedUrls =
          await Promise.all(
            newFiles.map((file) =>
              uploadToCloudinary(file, {
                folder:
                  "bookflow_news",
                public_id_prefix:
                  "news",
                tags: [
                  "bookflow",
                  "club",
                  "news",
                ],
                returnType:
                  "secure_url",
              }),
            ),
          );
      }

      const allImages = [
        ...existingImages,
        ...uploadedUrls,
      ].slice(0, MAX_IMAGES);

      const newsRef = doc(
        db,
        "bookClubNews",
        newsId,
      );

      await updateDoc(newsRef, {
        title,
        category: form.category,
        excerpt,
        content,

        images: allImages,

        // Keep old field compatible.
        coverImage:
          allImages[0] || "",

        featured: form.featured,

        updatedAt:
          serverTimestamp(),

        updatedById: user.uid,

        updatedByName:
          userProfile?.name ||
          user.displayName ||
          "BookFlow Team",
      });

      toast.success(
        "News article updated.",
      );

      navigate(
        `/club/news/${newsId}`,
      );
    } catch (error) {
      console.error(
        "Failed to update news:",
        error,
      );

      toast.error(
        "Failed to update the article.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="edit-news-page">
        <div className="club-state">
          Loading article...
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="edit-news-page">
        <div className="club-state">
          <h2>Access denied</h2>

          <Link to="/club/news">
            <FaArrowLeft />
            Back to news
          </Link>
        </div>
      </main>
    );
  }

  const totalImages =
    existingImages.length +
    newFiles.length;

  return (
    <main className="edit-news-page">
      <div className="edit-news-page__container">
        <Link
          to={`/club/news/${newsId}`}
          className="edit-news-page__back"
        >
          <FaArrowLeft />
          Back to article
        </Link>

        <section className="edit-news-page__header">
          <span>ADMIN</span>

          <h1>Edit article</h1>

          <p>
            Update the BookFlow Club
            publication.
          </p>
        </section>

        <form
          className="admin-news-form edit-news-form"
          onSubmit={handleSubmit}
        >
          <div className="admin-news-form__grid">
            <div className="admin-news-form__field admin-news-form__field--full">
              <label htmlFor="edit-news-title">
                Title
              </label>

              <input
                id="edit-news-title"
                name="title"
                value={form.title}
                onChange={handleChange}
                maxLength={160}
                required
              />
            </div>

            <div className="admin-news-form__field">
              <label htmlFor="edit-news-category">
                Category
              </label>

              <select
                id="edit-news-category"
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
              </select>
            </div>

            <div className="admin-news-form__field">
              <label>
                Images
                <span className="admin-news-form__hint">
                  {" "}
                  ({totalImages}/{MAX_IMAGES})
                </span>
              </label>

              <div className="admin-news-form__upload">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={
                    handleImageSelect
                  }
                />

                <button
                  type="button"
                  className="admin-news-form__upload-button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  disabled={
                    totalImages >=
                    MAX_IMAGES
                  }
                >
                  <FaPlus />

                  <span>
                    {totalImages >=
                    MAX_IMAGES
                      ? "Maximum 5 images"
                      : "Add images"}
                  </span>
                </button>
              </div>
            </div>

            <div className="admin-news-form__field admin-news-form__field--full">
              <div className="edit-news-images">
                {existingImages.map(
                  (image, index) => (
                    <div
                      className="edit-news-images__item"
                      key={`${image}-${index}`}
                    >
                      <img
                        src={image}
                        alt={`Existing ${
                          index + 1
                        }`}
                      />

                      <span>
                        {index + 1}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeExistingImage(
                            index,
                          )
                        }
                        aria-label="Remove image"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ),
                )}

                {newPreviews.map(
                  (preview, index) => (
                    <div
                      className="edit-news-images__item edit-news-images__item--new"
                      key={preview}
                    >
                      <img
                        src={preview}
                        alt={`New ${
                          index + 1
                        }`}
                      />

                      <span>
                        {existingImages.length +
                          index +
                          1}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          removeNewImage(
                            index,
                          )
                        }
                        aria-label="Remove image"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ),
                )}

                {totalImages === 0 && (
                  <div className="edit-news-images__empty">
                    <FaImage />

                    <span>
                      No images selected
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-news-form__field admin-news-form__field--full">
              <label htmlFor="edit-news-excerpt">
                Excerpt
              </label>

              <textarea
                id="edit-news-excerpt"
                name="excerpt"
                value={form.excerpt}
                onChange={handleChange}
                rows={3}
                maxLength={400}
              />
            </div>

            <div className="admin-news-form__field admin-news-form__field--full">
              <label htmlFor="edit-news-content">
                Content
              </label>

              <textarea
                id="edit-news-content"
                name="content"
                value={form.content}
                onChange={handleChange}
                rows={14}
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
              Mark this article as
              featured
            </span>
          </label>

          <div className="admin-news-form__actions">
            <Link
              to={`/club/news/${newsId}`}
              className="admin-news-form__cancel"
            >
              <FaTimes />
              Cancel
            </Link>

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
                ? "Saving..."
                : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}