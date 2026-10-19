import { useEffect, useRef, useState } from "react";

import {
  doc,
  getDoc,
  increment,
  updateDoc,
} from "firebase/firestore";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  FaEye,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaPen,
} from "react-icons/fa";

import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";

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

function formatDateTime(timestamp) {
  if (!timestamp?.toDate) {
    return "";
  }

  return timestamp.toDate().toLocaleString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

export default function NewsDetails() {
  const { newsId } = useParams();

  const { userProfile } = useAuth();

  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);

  const viewsUpdated = useRef(false);

  const isAdmin =
    userProfile?.role === "admin";

  useEffect(() => {
    async function loadNews() {
      try {
        const newsRef = doc(
          db,
          "bookClubNews",
          newsId,
        );

        const snapshot = await getDoc(newsRef);

        if (!snapshot.exists()) {
          setNews(null);
          return;
        }

        setNews({
          id: snapshot.id,
          ...snapshot.data(),
        });

        if (!viewsUpdated.current) {
          viewsUpdated.current = true;

          try {
            await updateDoc(newsRef, {
              views: increment(1),
            });
          } catch (error) {
            console.error(
              "Failed to update news views:",
              error,
            );
          }
        }
      } catch (error) {
        console.error(
          "Failed to load news:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    if (newsId) {
      loadNews();
    }
  }, [newsId]);

  if (loading) {
    return (
      <main className="news-details">
        <div className="club-state">
          Loading news...
        </div>
      </main>
    );
  }

  if (!news) {
    return (
      <main className="news-details">
        <div className="club-state">
          <h2>News not found</h2>

          <Link to="/club/news">
            <FaArrowLeft />
            Back to news
          </Link>
        </div>
      </main>
    );
  }

  const images = getImages(news);

  return (
    <main className="news-details">
      <div className="news-details__container">
        <Link
          to="/club/news"
          className="news-details__back"
        >
          <FaArrowLeft />
          Back to news
        </Link>

        {isAdmin && (
          <div className="news-details__admin">
            <Link
              to={`/club/news/${news.id}/edit`}
              className="news-details__edit"
            >
              <FaPen />
              Edit article
            </Link>
          </div>
        )}

        <article className="news-details__article">
{images.length > 0 && (
  <div className="news-details__image">
    <Swiper
      modules={[Pagination]}
      pagination={{
        clickable: true,
      }}
      loop={images.length > 1}
      className="news-details__slider"
    >
      {images.map((image, index) => (
        <SwiperSlide
          key={`${image}-${index}`}
        >
          <img
            src={image}
            alt={`${news.title} ${index + 1}`}
          />
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
)}

          <div className="news-details__content">
            <div className="news-details__category">
              {news.category}

              {news.featured && (
                <span>FEATURED</span>
              )}
            </div>

            <h1>{news.title}</h1>

            <div className="news-details__meta">
              <span>
                {news.authorName ||
                  "BookFlow Team"}
              </span>

              <span>
                {formatDate(news.createdAt)}
              </span>

              <span>
                <FaEye />
                {news.views || 0}
              </span>
            </div>

            {news.updatedAt?.toDate && (
              <div className="news-details__edited">
                Edited{" "}
                {formatDateTime(
                  news.updatedAt,
                )}

                {news.updatedByName && (
                  <>
                    {" "}
                    by{" "}
                    {news.updatedByName}
                  </>
                )}
              </div>
            )}

            {news.excerpt && (
              <p className="news-details__excerpt">
                {news.excerpt}
              </p>
            )}

            <div className="news-details__text">
              {news.content}
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}