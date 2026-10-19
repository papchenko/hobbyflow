import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaShoppingCart,
  FaSun,
  FaMoon,
  FaStream,
  FaBell,
  FaChevronDown,
  FaDesktop,
} from "react-icons/fa";
import { GrSystem } from "react-icons/gr";
import { FaPlus, FaDice } from "react-icons/fa6";
import { BsFileImage } from "react-icons/bs";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { FaBook, FaLayerGroup } from "react-icons/fa";
import { SiBookstack } from "react-icons/si";
import { useCart } from "../../context/CartContext";
import { useTheme } from "../../context/ThemeContext";
import MobileMenu from "./mobilemenu/MobileMenu";
import logoImg from "../../assets/logo.png";
import { useAuth } from "../../context/AuthContext";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  increment,
  getDocs,
} from "firebase/firestore";
import AuthModal from "../auth/AuthModal";
import CreatePostForm from "../pages/books/CreatePostForm";
import CreatePostFormCollections from "../pages/books/collections/CreatePostFormCollections";
import CreateComicModal from "../pages/books/Comics/CreateComicModal";
import CreateBoardGameForm from "../pages/books/boardGames/CreateBoardGameForm";
import { db } from "../../firebase";
import { toast } from "react-toastify";
import GlobalSearch from "../search/GlobalSearch";
import FavoritesModal from "../pages/books/FavoritesModal";
import SellerNotifications from "../notifications/SellerNotifications";
import BuyerNotifications from "../notifications/BuyerNotifications";
import { useUnreadSupport } from "../../hooks/useUnreadSupport";

import "./nav.scss";

const Nav = () => {
  const { user, userProfile } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notificationType, setNotificationType] = useState("seller");
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isComicModalOpen, setIsComicModalOpen] = useState(false);
  const [isBoardGameModalOpen, setIsBoardGameModalOpen] = useState(false);
  const { cartCount, setIsCartOpen } = useCart();
  const { theme, resolvedTheme, changeTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [tradeNotifications, setTradeNotifications] = useState([]);
  const desktopNotifRef = useRef(null);
  const mobileNotifRef = useRef(null);
  const themeRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const desktopPostMenuRef = useRef(null);
  const mobilePostMenuRef = useRef(null);

  const [books, setBooks] = useState([]);
  const [isBooksOpen, setIsBooksOpen] = useState(false);
  const unreadSupportCount = useUnreadSupport();

  useEffect(() => {
    const fetchBooks = async () => {
      const snap = await getDocs(collection(db, "books"));
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setBooks(data);
    };

    fetchBooks();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfilePhoto(null);
      return;
    }
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) setProfilePhoto(docSnap.data().photoURL || null);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const sellerTradeQuery = query(
      collection(db, "tradeOffers"),
      where("sellerId", "==", user.uid),
      where("status", "==", "pending"),
    );

    const unsubSellerTrade = onSnapshot(sellerTradeQuery, (snap) => {
      const data = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "sellerTrade",
        }))
        .filter((item) => !item.sellerRead);

      setTradeNotifications((prev) => {
        const others = prev.filter((x) => x.type !== "sellerTrade");
        return [...others, ...data];
      });
    });

    const buyerTradeQuery = query(
      collection(db, "tradeOffers"),
      where("buyerId", "==", user.uid),
    );

    const unsubBuyerTrade = onSnapshot(buyerTradeQuery, (snap) => {
      const data = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          type: "buyerTrade",
        }))
        .filter((item) => item.status !== "pending" && !item.buyerRead);

      setTradeNotifications((prev) => {
        const others = prev.filter((x) => x.type !== "buyerTrade");
        return [...others, ...data];
      });
    });

    return () => {
      unsubSellerTrade();
      unsubBuyerTrade();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const sellerQuery = query(
      collection(db, "orders"),
      where("sellerIds", "array-contains", user.uid),
    );
    const unsubSeller = onSnapshot(sellerQuery, (snap) => {
      const sellerOrders = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data(), type: "seller" }))
        .filter((order) => order.status === "pending");
      setNotifications((prev) => {
        const others = prev.filter((o) => o.type !== "seller");
        return [...others, ...sellerOrders];
      });
    });

    const buyerQuery = query(
      collection(db, "orders"),
      where("buyerId", "==", user.uid),
    );
    const unsubBuyer = onSnapshot(buyerQuery, async (snap) => {
      const buyerOrders = await Promise.all(
        snap.docs.map(async (docSnap) => {
          const data = { id: docSnap.id, ...docSnap.data(), type: "buyer" };

          if (
            data.status === "accepted" &&
            (!data.buyerNotification?.cardNumber ||
              data.buyerNotification?.totalAmount === undefined)
          ) {
            const sellerId = data.sellerIds?.[0];
            if (sellerId) {
              const sellerSnap = await getDoc(doc(db, "users", sellerId));
              if (sellerSnap.exists()) {
                const sellerData = sellerSnap.data();
                const totalAmount = data.items?.reduce(
                  (sum, item) =>
                    sum +
                    (item.purchaseType === "rental"
                      ? item.priceLending
                      : item.price),
                  0,
                );
                await updateDoc(doc(db, "orders", data.id), {
                  buyerNotification: {
                    status: "accepted",
                    cardNumber: sellerData?.cardNumber || "not specified",
                    bankName: sellerData?.bankName || "",
                    read: false,
                    totalAmount: totalAmount,
                  },
                });
                data.buyerNotification = {
                  status: "accepted",
                  cardNumber: sellerData?.cardNumber || "not specified",
                  bankName: sellerData?.bankName || "",
                  read: false,
                  totalAmount: totalAmount,
                };
              }
            }
          }

          return data;
        }),
      );
      const filtered = buyerOrders.filter(
        (o) =>
          (o.status === "accepted" || o.status === "rejected") &&
          !o.buyerNotification?.read,
      );
      setNotifications((prev) => {
        const others = prev.filter((o) => o.type !== "buyer");
        return [...others, ...filtered];
      });
    });

    return () => {
      unsubSeller();
      unsubBuyer();
    };
  }, [user]);

  const markAsRead = async (order) => {
    if (order.type !== "buyer" || order.buyerNotification?.read) return;
    try {
      await updateDoc(doc(db, "orders", order.id), {
        "buyerNotification.read": true,
      });
    } catch (e) {
      console.error("Failed to mark as read:", e);
    }
  };

  const handleAccept = async (orderId, orderData) => {
    try {
      if (orderData.status === "accepted") return;

      await updateDoc(doc(db, "orders", orderId), {
        status: "accepted",
        buyerNotification: {
          message: "Seller accepted your order",
          createdAt: new Date(),
        },
      });

      const totalAmount = orderData.items?.reduce(
        (sum, item) =>
          sum +
          (item.purchaseType === "rental" ? item.priceLending : item.price),
        0,
      );

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        completedOrders: increment(1),
        totalSalesAmount: increment(totalAmount),
        salesRating: increment(1),
        ratingCount: increment(1),
        ratingAverage: increment(1),
        "sellerStats.completedOrders": increment(1),
        "sellerStats.totalSalesAmount": increment(totalAmount),
        "sellerStats.salesRating": increment(1),
        "sellerStats.ratingCount": increment(1),
        "sellerStats.ratingAverage": increment(1),
        "sellerStats.lastSale": new Date(),
        "sellerStats.lastSaleAmount": totalAmount,
      });
    } catch (error) {
      console.error("Accept error:", error);
    }
  };

  const handleReject = async (orderId) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: "rejected",
        buyerNotification: { status: "rejected", read: false },
      });
      toast.info("Order rejected");
    } catch {
      toast.error("Failed to reject order");
    }
  };

  const sellerCount = notifications.filter(
    (n) => n.type === "seller" && n.status === "pending",
  ).length;
  const buyerCount = notifications.filter(
    (n) =>
      n.type === "buyer" &&
      (n.status === "accepted" || n.status === "rejected") &&
      !n.buyerNotification?.read,
  ).length;
  const sellerTradeCount = tradeNotifications.filter(
    (t) => t.type === "sellerTrade",
  ).length;

  const buyerTradeCount = tradeNotifications.filter(
    (t) => t.type === "buyerTrade",
  ).length;

  const desktopProfileRef = useRef(null);
  const mobileProfileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isProfileOpen) return;

      const clickedInsideDesktop = desktopProfileRef.current?.contains(
        event.target,
      );

      const clickedInsideMobile = mobileProfileRef.current?.contains(
        event.target,
      );

      if (!clickedInsideDesktop && !clickedInsideMobile) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isThemeMenuOpen &&
        themeRef.current &&
        !themeRef.current.contains(event.target)
      ) {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isThemeMenuOpen]);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isPostMenuOpen) return;

      const clickedInsideDesktop = desktopPostMenuRef.current?.contains(
        event.target,
      );

      const clickedInsideMobile = mobilePostMenuRef.current?.contains(
        event.target,
      );

      if (!clickedInsideDesktop && !clickedInsideMobile) {
        setIsPostMenuOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isPostMenuOpen]);

  const openBookPost = () => {
    setIsPostMenuOpen(false);
    setIsPostModalOpen(true);
  };

  const openCollectionPost = () => {
    setIsPostMenuOpen(false);
    setIsCollectionModalOpen(true);
  };
const openComicPost = () => {
  console.log("COMIC POST CLICKED");

  setIsPostMenuOpen(false);
  setIsComicModalOpen(true);
};
const openBoardGamePost = () => {
  setIsPostMenuOpen(false);
  setIsBoardGameModalOpen(true);
};
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="mx-2">
            <img
              src={logoImg}
              alt="Logo"
              className="logo-img transition dark:invert"
            />
          </Link>
          <div className="search-bar hidden md:flex">
            <div className="hidden md:flex">
              <GlobalSearch />
            </div>
            <button type="submit" className="px-3 rounded-r">
              <i className="fas fa-search"></i>
            </button>
          </div>
          {/* Desktop nav + icons */}
          {/* space-x-6 */}
          <div className="hidden md:flex items-center space-x-3">
            <nav className="flex space-x-6">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `font-medium ${isActive ? "text-[var(--secondary-color)]" : "text-gray-700 dark:text-gray-300 hover:text-[var(--secondary-color-hover)]"}`
                }>
                Home
              </NavLink>
<div className="relative group">
  <button className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 hover:text-[var(--secondary-color-hover)] transition-colors">
    <span className="t-1">Library</span>

    <FaChevronDown className="text-xs transition-transform duration-300 group-hover:rotate-180 mt-0.5" />
  </button>

  {/* Library dropdown */}
  <div className="absolute left-0 top-full pt-3 w-52 z-50 invisible opacity-0 translate-y-1 pointer-events-none group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200">
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-visible">

      {/* Books */}
      <div className="relative group/books">
        <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[var(--secondary-color-hover)] transition-colors cursor-pointer">
          <span>Books</span>

          <FaChevronDown className="text-[10px] -rotate-90" />
        </div>

        {/* Books submenu */}
<div className="absolute left-full top-0 w-52 invisible opacity-0 translate-x-1 pointer-events-none group-hover/books:visible group-hover/books:opacity-100 group-hover/books:translate-x-0 group-hover/books:pointer-events-auto transition-all duration-200">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">

            <NavLink
              to="/books"
              className={({ isActive }) =>
                `block px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? "bg-gray-100 dark:bg-gray-700 text-[var(--secondary-color)]"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[var(--secondary-color-hover)]"
                }`
              }>
              Books
            </NavLink>

            <NavLink
              to="/book-collections"
              className={({ isActive }) =>
                `block px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? "bg-gray-100 dark:bg-gray-700 text-[var(--secondary-color)]"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[var(--secondary-color-hover)]"
                }`
              }>
              Book Collections
            </NavLink>

          </div>
        </div>
      </div>

      {/* Comics & Games */}
      {/* Hobby Zone */}
      <div className="relative group/others">
        <div className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[var(--secondary-color-hover)] transition-colors cursor-pointer">
          <span>Hobby Zone</span>

          <FaChevronDown className="text-[10px] -rotate-90" />
        </div>

        {/* Hobby Zone submenu */}
<div className="absolute left-full top-0 w-52 invisible opacity-0 translate-x-1 pointer-events-none group-hover/others:visible group-hover/others:opacity-100 group-hover/others:translate-x-0 group-hover/others:pointer-events-auto transition-all duration-200">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">

            <NavLink
              to="/comics"
              className={({ isActive }) =>
                `block px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? "bg-gray-100 dark:bg-gray-700 text-[var(--secondary-color)]"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[var(--secondary-color-hover)]"
                }`
              }>
              Comics
            </NavLink>
            <NavLink
              to="/board-games"
              className={({ isActive }) =>
                `block px-4 py-3 text-sm transition-colors ${
                  isActive
                    ? "bg-gray-100 dark:bg-gray-700 text-[var(--secondary-color)]"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[var(--secondary-color-hover)]"
                }`
              }>
              Board Games
            </NavLink>

          </div>
        </div>
      </div>

    </div>
  </div>
</div>
              <div
                className={`relative group ${
                  !user ? "opacity-50 cursor-not-allowed" : ""
                }`}>
                <button
                  type="button"
                  disabled={!user}
                  className={`flex items-center gap-1 font-medium transition-colors ${
                    user
                      ? "text-gray-700 dark:text-gray-300 hover:text-[var(--secondary-color-hover)] cursor-pointer"
                      : "text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  }`}>
                  <span className="t-1">Services</span>

                  <FaChevronDown
                    className={`text-xs mt-0.5 transition-transform duration-300 ${
                      user ? "group-hover:rotate-180" : ""
                    }`}
                  />
                </button>

                {user && (
                  <div className="absolute left-0 top-full pt-3 w-48 z-50 invisible opacity-0 translate-y-1 pointer-events-none group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200">
                    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
                      <NavLink
                        to="/hobbyflow-reader"
                        className={({ isActive }) =>
                          `block px-4 py-3 text-sm transition-colors ${
                            isActive
                              ? "bg-gray-100 dark:bg-gray-700 text-[var(--secondary-color)]"
                              : "text-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 hover:text-[var(--secondary-color-hover)]"
                          }`
                        }>
                        HobbyFlow Reader
                      </NavLink>
                    </div>
                  </div>
                )}
              </div>
              <NavLink
                to="/takers"
                className={({ isActive }) =>
                  `font-medium ${isActive ? "text-[var(--secondary-color)]" : "text-gray-700 dark:text-gray-300 hover:text-[var(--secondary-color-hover)]"}`
                }>
                Takers
              </NavLink>
              <NavLink
                to="/takers-premium"
                className={({ isActive }) =>
                  `font-medium ${isActive ? "text-[var(--secondary-color)]" : "text-gray-700 dark:text-gray-300 hover:text-[var(--secondary-color-hover)]"}`
                }>
                Premium
              </NavLink>
              <NavLink
                to="/club"
                className={({ isActive }) =>
                  `font-medium ${isActive ? "text-[var(--secondary-color)]" : "text-gray-700 dark:text-gray-300 hover:text-[var(--secondary-color-hover)]"}`
                }>
                HobbyFlow Club
              </NavLink>
            </nav>

            <div className="flex items-center space-x-4">
              {userProfile?.role === "admin" && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    // `font-medium ${isActive ? "text-red-500" : "text-gray-700 dark:text-gray-300 hover:text-red-400"}`
                    `font-medium ${isActive ? "" : "text-gray-700 dark:text-gray-300 hover:text-red-400"}`
                  }>
                  <span className="relative inline-flex">
                    <MdOutlineAdminPanelSettings className="text-3xl" />

                    {unreadSupportCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
                    )}
                  </span>
                </NavLink>
              )}
              {userProfile?.taker && (
                <div className="relative" ref={desktopPostMenuRef}>
                  <button
                    onClick={() => setIsPostMenuOpen((prev) => !prev)}
                    className="p-2 rounded-full text-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    aria-label="Create post"
                    title="Create post">
                    <FaPlus
                      className={`transition-transform duration-200 ${
                        isPostMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isPostMenuOpen && (
                    <div className="absolute right-0 top-full mt-3 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden z-50">

                      <button
                        onClick={openBookPost}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                          <FaBook />
                        </span>

                        <span>
                          <span className="block text-sm font-semibold text-gray-800 dark:text-white">
                            One Book Post
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Sell one individual book
                          </span>
                        </span>
                      </button>

                      <button
                        onClick={openCollectionPost}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                          <SiBookstack />
                        </span>

                        <span>
                          <span className="block text-sm font-semibold text-gray-800 dark:text-white">
                            Book Collection Post
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Sell several books together
                          </span>
                        </span>
                      </button>
<button
  onClick={openComicPost}
  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
    <BsFileImage />
  </span>

  <span>
    <span className="block text-sm font-semibold text-gray-800 dark:text-white">
      Comic Post
    </span>

    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
      Sell one individual comic
    </span>
  </span>
</button>
<button
  onClick={openBoardGamePost}
  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition"
>
  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
    <FaDice />
  </span>

  <span>
    <span className="block text-sm font-semibold text-gray-800 dark:text-white">
      Board Game Post
    </span>

    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
      Sell or rent a board game
    </span>
  </span>
</button>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications */}
              <div className="relative" ref={desktopNotifRef}>
                {user && (
                  <button
                    onClick={() => {
                      if (!isNotifOpen) {
                        if (sellerCount + sellerTradeCount > 0) {
                          setNotificationType("seller");
                        } else {
                          setNotificationType("buyer");
                        }
                      }

                      setIsNotifOpen(!isNotifOpen);
                    }}
                    className="relative p-2 rounded-full text-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <FaBell />
                    {sellerCount +
                      buyerCount +
                      sellerTradeCount +
                      buyerTradeCount >
                      0 && (
                      <span
                        className="absolute -top-0 -right-0 w-[18px] px-1
              flex
              items-center
              justify-center
              text-[10px]
              font-bold
              leading-none
              h-[18px] bg-[var(--secondary-color)] text-white text-xs font-bold px-1 rounded-full">
                        {sellerCount +
                          buyerCount +
                          sellerTradeCount +
                          buyerTradeCount}
                      </span>
                    )}
                  </button>
                )}
                {isNotifOpen && (
                  <>
                    {notificationType === "seller" ? (
                      <SellerNotifications
                        isOpen={true}
                        onClose={() => setIsNotifOpen(false)}
                      />
                    ) : (
                      <BuyerNotifications
                        isOpen={true}
                        onClose={() => setIsNotifOpen(false)}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Theme selector */}
              <div className="relative" ref={themeRef}>
                <button
                  type="button"
                  onClick={() => setIsThemeMenuOpen((prev) => !prev)}
                  className="p-2 rounded-full text-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  aria-label="Change theme"
                  title="Change theme">
                  {theme === "system" ? (
                    <GrSystem />
                  ) : resolvedTheme === "dark" ? (
                    <FaMoon />
                  ) : (
                    <FaSun />
                  )}
                </button>

                {isThemeMenuOpen && (
                  <div className="theme-popup">
                    <button
                      type="button"
                      className={`theme-popup__option ${
                        theme === "light" ? "theme-popup__option--active" : ""
                      }`}
                      onClick={() => {
                        changeTheme("light");
                        setIsThemeMenuOpen(false);
                      }}>
                      <FaSun />
                      <span>Light</span>
                    </button>

                    <button
                      type="button"
                      className={`theme-popup__option ${
                        theme === "dark" ? "theme-popup__option--active" : ""
                      }`}
                      onClick={() => {
                        changeTheme("dark");
                        setIsThemeMenuOpen(false);
                      }}>
                      <FaMoon />
                      <span>Dark</span>
                    </button>

                    <button
                      type="button"
                      className={`theme-popup__option ${
                        theme === "system" ? "theme-popup__option--active" : ""
                      }`}
                      onClick={() => {
                        changeTheme("system");
                        setIsThemeMenuOpen(false);
                      }}>
                      <GrSystem />
                      <span>System</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Cart */}
              <div
                onClick={() => setIsCartOpen(true)}
                className="relative cursor-pointer p-2 rounded-full text-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                <FaShoppingCart />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              {/* Desktop Profile */}
              <div ref={desktopProfileRef} className="hidden md:block relative">
                <div
                  onClick={() => {
                    if (!user) {
                      setAuthOpen(true);
                    } else {
                      setIsProfileOpen((prev) => !prev);
                    }
                  }}
                  className="cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                  {!user ? (
                    <>
                      <button
                        onClick={() => setAuthOpen(true)}
                        className="px-3 py-1 rounded-lg bg-[var(--secondary-color)] hover:bg-[var(--secondary-color-hover)] text-white font-medium transition">
                        Sign In
                      </button>
                    </>
                  ) : profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-bold text-lg">
                      {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                {isProfileOpen && user && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg z-50">
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setIsProfileOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-white">
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        setIsFavoritesOpen(true);
                        setIsProfileOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-white">
                      Favorites
                    </button>
                    <button
                      onClick={() => {
                        navigate("/buyer/orders");
                        setIsProfileOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-white">
                      Purchase History
                    </button>
                    {userProfile?.taker && (
                      <button
                        onClick={() => {
                          navigate("/seller/orders");
                          setIsProfileOpen(false);
                        }}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-white">
                        Order History
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile icons & menu */}
          <div className="flex md:hidden items-center space-x-3">
            {userProfile?.taker && (
              <div className="relative" ref={mobilePostMenuRef}>
                <button
                  onClick={() => setIsPostMenuOpen((prev) => !prev)}
                  className="p-1 rounded-full text-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  aria-label="Create post"
                  title="Create post">
                  <FaPlus
                    className={`transition-transform duration-200 ${
                      isPostMenuOpen ? "rotate-190" : ""
                    }`}
                  />
                </button>

                {isPostMenuOpen && (
                  <div
                    className="
                    fixed left-1/2 top-[100%] -translate-x-1/2 -translate-y-1/2
                    w-[calc(100%-2rem)] max-w-64
                    rounded-xl border border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-800
                    shadow-xl overflow-hidden z-50

                    sm:absolute sm:left-auto sm:right-0 sm:top-full
                    sm:translate-x-0 sm:translate-y-0 sm:mt-3 sm:w-64
                  ">
                    <button
                      onClick={openBookPost}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                      <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        <FaBook />
                      </span>

                      <span>
                        <span className="block text-sm font-semibold text-gray-800 dark:text-white">
                          One Book Post
                        </span>

                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Sell one individual book
                        </span>
                      </span>
                    </button>

                    <button
                      onClick={openCollectionPost}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                      <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        <SiBookstack />
                      </span>

                      <span>
                        <span className="block text-sm font-semibold text-gray-800 dark:text-white">
                          Book Collection Post
                        </span>

                        <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Sell several books together
                        </span>
                      </span>
                    </button>
<button
  onClick={openComicPost}
  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition">
  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
    <BsFileImage />
  </span>

  <span>
    <span className="block text-sm font-semibold text-gray-800 dark:text-white">
      Comics Post
    </span>

    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
      Sell one individual comic
    </span>
  </span>
</button>
<button
  onClick={openBoardGamePost}
  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition"
>
  <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
    <FaDice />
  </span>

  <span>
    <span className="block text-sm font-semibold text-gray-800 dark:text-white">
      Board Game Post
    </span>

    <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
      Sell or rent a board game
    </span>
  </span>
</button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Notifications */}
            <div className="relative" ref={mobileNotifRef}>
              {user && (
                <button
                  onClick={() => {
                    if (!isNotifOpen) {
                      if (sellerCount + sellerTradeCount > 0) {
                        setNotificationType("seller");
                      } else {
                        setNotificationType("buyer");
                      }
                    }

                    setIsNotifOpen(!isNotifOpen);
                  }}
                  className="relative p-2 rounded-full text-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <FaBell />
                  {sellerCount +
                    buyerCount +
                    sellerTradeCount +
                    buyerTradeCount >
                    0 && (
                    <span
                      className="absolute -top-0 -right-0 px-1
              flex
              items-center
              justify-center text-[10px]
              font-bold
              leading-none bg-[var(--secondary-color)] w-[18px]
              h-[18px] text-white text-xs font-bold px-1 rounded-full">
                      {sellerCount +
                        buyerCount +
                        sellerTradeCount +
                        buyerTradeCount}
                    </span>
                  )}
                </button>
              )}
              {isNotifOpen && (
                <>
                  {notificationType === "seller" ? (
                    <SellerNotifications
                      isOpen={true}
                      onClose={() => setIsNotifOpen(false)}
                    />
                  ) : (
                    <BuyerNotifications
                      isOpen={true}
                      onClose={() => setIsNotifOpen(false)}
                    />
                  )}
                </>
              )}
            </div>
            <div
              onClick={() => setIsCartOpen(true)}
              className="relative p-1 rounded-full text-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              <FaShoppingCart />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <div ref={mobileProfileRef} className="md:hidden relative">
              <div
                onClick={() => {
                  if (!user) {
                    setAuthOpen(true);
                  } else {
                    setIsProfileOpen((prev) => !prev);
                  }
                }}
                className="p-1 rounded-full text-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                {!user ? (
                  <>
                    <button
                      onClick={() => setAuthOpen(true)}
                      className="px-2 py-1 rounded-lg bg-[var(--secondary-color)] hover:bg-[var(--secondary-color-hover)] text-white font-medium transition">
                      Sign In
                    </button>
                  </>
                ) : profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white font-bold text-lg">
                    {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>

              {isProfileOpen && user && (
                <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg z-50">
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setIsProfileOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-white">
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsFavoritesOpen(true);
                      setIsProfileOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-white">
                    Favorites
                  </button>
                  <button
                    onClick={() => {
                      navigate("/buyer/orders");
                      setIsProfileOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-white">
                    Purchase History
                  </button>
                  {userProfile?.taker && (
                    <button
                      onClick={() => {
                        navigate("/seller/orders");
                        setIsProfileOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-white">
                      Order History
                    </button>
                  )}
                </div>
              )}
            </div>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full text-2xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
              <FaStream />
            </button>
          </div>
        </div>
        {/* Mobile search */}
        <div className="md:hidden mt-2">
          <div className="search-bar">
            <div className="flex md:hidden relative w-full md:w-64">
              <GlobalSearch />
            </div>
            <button type="submit">
              <i className="fas fa-search"></i>
            </button>
          </div>
        </div>
      </div>
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {isPostModalOpen && (
        <CreatePostForm onClose={() => setIsPostModalOpen(false)} />
      )}

      {isCollectionModalOpen && (
        <CreatePostFormCollections
          onClose={() => setIsCollectionModalOpen(false)}
        />
      )}

      {isComicModalOpen && (
        <CreateComicModal
          isOpen={isComicModalOpen}
          onClose={() => setIsComicModalOpen(false)}
        />
      )}
      {isBoardGameModalOpen && (
  <CreateBoardGameForm
    onClose={() => setIsBoardGameModalOpen(false)}
  />
)}

      <FavoritesModal isOpen={isFavoritesOpen} setIsOpen={setIsFavoritesOpen} />
    </header>
  );
};

export default Nav;
