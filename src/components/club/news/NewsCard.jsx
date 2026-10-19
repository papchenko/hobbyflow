import { Link } from "react-router-dom";
import {
  FaArrowRight,
  FaChevronLeft,
  FaChevronRight,
  FaPen,
  FaTrash,
} from "react-icons/fa";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

import {
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "../../../firebase";
import { useAuth } from "../../../context/AuthContext";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

function formatDate(timestamp) {
  if (!timestamp?.toDate) {
    return "";
  }

  return timestamp.toDate().toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );
}

function getImages(news) {
  if (
    Array.isArray(news.images) &&
    news.images.length > 0
  ) {
    return news.images;
  }

  if (news.coverImage) {
    return [news.coverImage];
  }

  return [];
}

export default function NewsCard({ news }) {
  const { userProfile } = useAuth();

  const isAdmin =
    userProfile?.role === "admin";

  const images = getImages(news);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${news.title}"? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(
        doc(db, "bookClubNews", news.id),
      );
    } catch (error) {
      console.error(
        "Failed to delete news:",
        error,
      );

      window.alert(
        "Failed to delete the news. Please try again.",
      );
    }
  };

  return (
    <article className="news-card">
      {images.length > 0 && (
  <div className="news-card__image">
    <Swiper
      modules={[Pagination]}
      pagination={{
        clickable: true,
      }}
      loop={images.length > 1}
      className="news-card__slider"
    >
      {images.map((image, index) => (
        <SwiperSlide
          key={`${image}-${index}`}
          className="pb-5"
        >
          <img
            src={image}
            alt={`${news.title} ${index + 1}`}
            loading="lazy"
          />
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
)}

      <div className="news-card__content">
        <div className="news-card__top">
          <span className="news-card__category">
            {news.category}
          </span>

          {news.featured && (
            <span className="news-card__featured">
              FEATURED
            </span>
          )}
        </div>

        <h2>{news.title}</h2>

        {news.excerpt && (
          <p>{news.excerpt}</p>
        )}

        <div className="news-card__meta">
          <span>
            {news.authorName ||
              "BookFlow Team"}
          </span>

          <span>
            {formatDate(news.createdAt)}
          </span>
        </div>

        {news.updatedAt?.toDate && (
  <div className="news-card__edited">
    Edited{" "}
    {news.updatedAt.toDate().toLocaleDateString(
      "en-US",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      },
    )}
  </div>
)}

        <div className="news-card__footer">
          <Link
            to={`/club/news/${news.id}`}
            className="news-card__read"
          >
            Read article
            <FaArrowRight />
          </Link>

          {isAdmin && (
            <div className="news-card__admin-actions">
              <Link
                to={`/club/news/${news.id}/edit`}
                className="news-card__edit"
              >
                <FaPen />
                Edit
              </Link>

              <button
                type="button"
                className="news-card__delete"
                onClick={handleDelete}
              >
                <FaTrash />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}