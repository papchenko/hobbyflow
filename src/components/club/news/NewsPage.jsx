import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../../firebase";
import { useAuth } from "../../../context/AuthContext";

import ClubNavigation from "../navigation/ClubNavigation";
import NewsCard from "./NewsCard";
import AdminNewsForm from "./AdminNewsForm";

import "./news.scss";

// const CATEGORIES = [
//   "All",
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

export default function NewsPage() {
  const { userProfile } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] =
    useState("All");

  useEffect(() => {
    const newsQuery = query(
      collection(db, "bookClubNews"),
      where("published", "==", true),
    );

    const unsubscribe = onSnapshot(
      newsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        data.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;

          const dateA = a.createdAt?.toDate
            ? a.createdAt.toDate().getTime()
            : 0;

          const dateB = b.createdAt?.toDate
            ? b.createdAt.toDate().getTime()
            : 0;

          return dateB - dateA;
        });

        setNews(data);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Failed to load BookFlow news:",
          error,
        );

        setNews([]);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const filteredNews =
    activeCategory === "All"
      ? news
      : news.filter(
          (item) =>
            item.category === activeCategory,
        );

  return (
    <main className="club-news-page">
      <div className="club-news-page__container">
        <ClubNavigation />

        {/* <header className="club-news-page__header">
          <span>BOOKFLOW CLUB</span>

          <h1>News</h1>

          <p>
            The latest BookFlow updates, book news,
            collecting stories and community updates.
          </p>
        </header> */}

        {userProfile?.role === "admin" && (
          <AdminNewsForm />
        )}

        <nav className="club-news-page__categories">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={
                activeCategory === category
                  ? "active"
                  : ""
              }
              onClick={() =>
                setActiveCategory(category)
              }
            >
              {category}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="club-state">
            Loading news...
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="club-state">
            No news in this category yet.
          </div>
        ) : (
          <div className="club-news-page__grid">
            {filteredNews.map((item) => (
              <NewsCard
                key={item.id}
                news={item}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}