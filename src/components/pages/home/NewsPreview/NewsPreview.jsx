import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { FaArrowRight, FaLock } from "react-icons/fa";

import { db } from "../../../../firebase";
import { useAuth } from "../../../../context/AuthContext";

import NewsCard from "../../../club/news/NewsCard";

import "./NewsPreview.scss";

export default function NewsPreview() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNews([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const newsQuery = query(
      collection(db, "bookClubNews"),
      where("published", "==", true)
    );

    const unsubscribe = onSnapshot(
      newsQuery,
      (snapshot) => {
        const newsData = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        newsData.sort((a, b) => {
          const dateA = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : 0;

          const dateB = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : 0;

          return dateB - dateA;
        });

        setNews(newsData.slice(0, 3));
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load HobbyFlow news preview:", error);

        setNews([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <section className="news-preview">
      <div className="news-preview__container">
        <div className="news-preview__header">
          <div className="news-preview__heading">
            <span className="news-preview__label">
              HobbyFlow CLUB
            </span>

            <h2>News</h2>

            <p>
              Latest HobbyFlow news, platform updates, community events,
              and useful content for book lovers.
            </p>
          </div>

          {user && (
            <button
              type="button"
              className="news-preview__link"
              onClick={() => navigate("/club/news")}
            >
              <span>All news</span>
              <FaArrowRight />
            </button>
          )}
        </div>

        {!user ? (
          <div className="news-preview__login">
            <div className="news-preview__login-icon">
              <FaLock />
            </div>

            <h3>Log in to see the news</h3>

            <p>
              Please log in to your account to view the latest
              HobbyFlow news and updates.
            </p>

            {/* <button
              type="button"
              className="news-preview__login-button"
              onClick={() => navigate("/login")}
            >
              Log in
            </button> */}
          </div>
        ) : loading ? (
          <div className="news-preview__status">
            Loading news...
          </div>
        ) : news.length === 0 ? (
          <div className="news-preview__status">
            There is no news yet.
          </div>
        ) : (
          <div className="news-preview__grid">
            {news.map((item) => (
              <NewsCard
                key={item.id}
                news={item}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}