import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import ThemeToggle from "../../theme/ThemeToggle";

import {
  FaArrowLeft,
  FaArrowRight,
} from "react-icons/fa";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { useUnreadSupport } from "../../../hooks/useUnreadSupport";

import "./mobileMenu.scss";

const MobileMenu = ({ isOpen, onClose }) => {
  const { user, userProfile } = useAuth();

  const [activeMenu, setActiveMenu] = useState("main");
  const unreadSupportCount = useUnreadSupport();


const menuIntros = [
  // ==========================================
  // BOOKS — 25
  // ==========================================

  {
    first: "Your next",
    highlight: "chapter",
    last: "starts here.",
  },
  {
    first: "Find your",
    highlight: "next great read",
    last: "right here.",
  },
  {
    first: "Every book",
    highlight: "holds a story",
    last: "worth discovering.",
  },
  {
    first: "Open a book.",
    highlight: "Enter a world.",
    last: "Stay a while.",
  },
  {
    first: "Your next",
    highlight: "favorite story",
    last: "is waiting.",
  },
  {
    first: "Read more.",
    highlight: "Discover more.",
    last: "Feel more.",
  },
  {
    first: "Turn the page.",
    highlight: "Find something",
    last: "extraordinary.",
  },
  {
    first: "One book.",
    highlight: "A thousand worlds.",
    last: "Endless possibilities.",
  },
  {
    first: "Great stories",
    highlight: "begin with",
    last: "a single page.",
  },
  {
    first: "Discover",
    highlight: "new stories",
    last: "every day.",
  },
  {
    first: "Your story",
    highlight: "could begin",
    last: "with a book.",
  },
  {
    first: "Books open",
    highlight: "new worlds",
    last: "for curious minds.",
  },
  {
    first: "Take a moment.",
    highlight: "Pick a book.",
    last: "Lose yourself.",
  },
  {
    first: "There is always",
    highlight: "another story",
    last: "to explore.",
  },
  {
    first: "Read what",
    highlight: "inspires you",
    last: "every day.",
  },
  {
    first: "A new book.",
    highlight: "A new world.",
    last: "A new beginning.",
  },
  {
    first: "Your next",
    highlight: "favorite book",
    last: "might be here.",
  },
  {
    first: "Escape into",
    highlight: "another world",
    last: "one page at a time.",
  },
  {
    first: "Turn pages.",
    highlight: "Make memories.",
    last: "Repeat.",
  },
  {
    first: "Read.",
    highlight: "Imagine.",
    last: "Explore.",
  },
  {
    first: "Stories connect",
    highlight: "people and worlds",
    last: "across time.",
  },
  {
    first: "A good book",
    highlight: "stays with you",
    last: "long after the end.",
  },
  {
    first: "Find a story",
    highlight: "worth remembering",
    last: "forever.",
  },
  {
    first: "Your next",
    highlight: "literary adventure",
    last: "is a page away.",
  },
  {
    first: "Let the pages",
    highlight: "take you",
    last: "somewhere new.",
  },

  // ==========================================
  // COMICS — 25
  // ==========================================

  {
    first: "Every panel",
    highlight: "tells a story",
    last: "worth exploring.",
  },
  {
    first: "Discover heroes.",
    highlight: "Explore universes.",
    last: "Live the adventure.",
  },
  {
    first: "Your next",
    highlight: "comic adventure",
    last: "starts here.",
  },
  {
    first: "One panel.",
    highlight: "Endless action.",
    last: "Infinite stories.",
  },
  {
    first: "Enter a world",
    highlight: "beyond imagination",
    last: "one panel at a time.",
  },
  {
    first: "Heroes rise.",
    highlight: "Legends begin.",
    last: "Stories live on.",
  },
  {
    first: "Every hero",
    highlight: "has a story",
    last: "waiting to unfold.",
  },
  {
    first: "Turn the page.",
    highlight: "Meet your heroes.",
    last: "Explore their worlds.",
  },
  {
    first: "Beyond the panels",
    highlight: "new universes",
    last: "are waiting.",
  },
  {
    first: "Discover",
    highlight: "legendary stories",
    last: "in every issue.",
  },
  {
    first: "Your next",
    highlight: "favorite hero",
    last: "is waiting.",
  },
  {
    first: "From the first panel",
    highlight: "to the final page",
    last: "feel the adventure.",
  },
  {
    first: "Every universe",
    highlight: "begins with",
    last: "a single story.",
  },
  {
    first: "Explore the art.",
    highlight: "Follow the story.",
    last: "Feel the action.",
  },
  {
    first: "New worlds.",
    highlight: "Iconic characters.",
    last: "Unforgettable stories.",
  },
  {
    first: "Behind every mask",
    highlight: "there is a story",
    last: "worth telling.",
  },
  {
    first: "Your imagination",
    highlight: "has no limits",
    last: "between the panels.",
  },
  {
    first: "Every comic",
    highlight: "opens a universe",
    last: "of possibilities.",
  },
  {
    first: "Heroes are born.",
    highlight: "Villains rise.",
    last: "Legends remain.",
  },
  {
    first: "Find your",
    highlight: "next obsession",
    last: "between the panels.",
  },
  {
    first: "Stories in color.",
    highlight: "Worlds in motion.",
    last: "Adventure in every panel.",
  },
  {
    first: "The next chapter",
    highlight: "of your universe",
    last: "starts here.",
  },
  {
    first: "Beyond the ordinary.",
    highlight: "Into the extraordinary.",
    last: "One comic at a time.",
  },
  {
    first: "Discover stories",
    highlight: "drawn to inspire",
    last: "and made to remember.",
  },
  {
    first: "Collect the stories.",
    highlight: "Explore the worlds.",
    last: "Celebrate the art.",
  },

  // ==========================================
  // BOARD GAMES — 25
  // ==========================================

  {
    first: "Your next",
    highlight: "game night",
    last: "starts here.",
  },
  {
    first: "Roll the dice.",
    highlight: "Make your move.",
    last: "Enjoy the game.",
  },
  {
    first: "One table.",
    highlight: "Endless adventures.",
    last: "Countless memories.",
  },
  {
    first: "Gather your friends.",
    highlight: "Choose a game.",
    last: "Let the fun begin.",
  },
  {
    first: "Every move",
    highlight: "creates a story",
    last: "worth remembering.",
  },
  {
    first: "Play together.",
    highlight: "Think differently.",
    last: "Win together.",
  },
  {
    first: "Your next",
    highlight: "great adventure",
    last: "is on the table.",
  },
  {
    first: "New challenges.",
    highlight: "New strategies.",
    last: "New memories.",
  },
  {
    first: "Shuffle the cards.",
    highlight: "Roll the dice.",
    last: "Start the adventure.",
  },
  {
    first: "Every game",
    highlight: "brings people",
    last: "closer together.",
  },
  {
    first: "Think ahead.",
    highlight: "Play your way.",
    last: "Enjoy every moment.",
  },
  {
    first: "Great memories",
    highlight: "begin around",
    last: "the game table.",
  },
  {
    first: "A little strategy.",
    highlight: "A little luck.",
    last: "A lot of fun.",
  },
  {
    first: "Your next",
    highlight: "winning move",
    last: "starts here.",
  },
  {
    first: "Explore new worlds.",
    highlight: "Master new games.",
    last: "Create new memories.",
  },
  {
    first: "Every turn",
    highlight: "changes the game",
    last: "in unexpected ways.",
  },
  {
    first: "One more round.",
    highlight: "One more challenge.",
    last: "One more memory.",
  },
  {
    first: "Choose your game.",
    highlight: "Build your strategy.",
    last: "Make your move.",
  },
  {
    first: "Discover games",
    highlight: "worth playing",
    last: "again and again.",
  },
  {
    first: "The best moments",
    highlight: "happen around",
    last: "a table.",
  },
  {
    first: "Every player",
    highlight: "has a strategy",
    last: "and a story.",
  },
  {
    first: "Unbox a game.",
    highlight: "Unlock an adventure.",
    last: "Share the experience.",
  },
  {
    first: "Play for fun.",
    highlight: "Stay for the memories.",
    last: "Come back for more.",
  },
  {
    first: "Your next",
    highlight: "tabletop adventure",
    last: "is waiting.",
  },
  {
    first: "The board is set.",
    highlight: "The choice is yours.",
    last: "Let the game begin.",
  },

  // ==========================================
  // UNIVERSAL — 15
  // BOOKS + COMICS + BOARD GAMES
  // ==========================================

  {
    first: "Discover more.",
    highlight: "Explore more.",
    last: "Experience more.",
  },
  {
    first: "Your next",
    highlight: "favorite thing",
    last: "is waiting.",
  },
  {
    first: "One passion.",
    highlight: "Endless possibilities.",
    last: "Your own journey.",
  },
  {
    first: "Find what",
    highlight: "inspires you",
    last: "every day.",
  },
  {
    first: "Explore worlds.",
    highlight: "Collect memories.",
    last: "Share experiences.",
  },
  {
    first: "Your hobbies.",
    highlight: "Your universe.",
    last: "Your story.",
  },
  {
    first: "More than hobbies.",
    highlight: "A world of passions.",
    last: "Made for you.",
  },
  {
    first: "Find your passion.",
    highlight: "Explore your world.",
    last: "Enjoy the journey.",
  },
  {
    first: "New discoveries.",
    highlight: "New experiences.",
    last: "Endless inspiration.",
  },
  {
    first: "Every passion",
    highlight: "has a story",
    last: "worth sharing.",
  },
  {
    first: "Discover.",
    highlight: "Collect.",
    last: "Connect.",
  },
  {
    first: "Your interests.",
    highlight: "Your community.",
    last: "Your world.",
  },
  {
    first: "Something new.",
    highlight: "Something exciting.",
    last: "Something for you.",
  },
  {
    first: "A place to",
    highlight: "explore your passions",
    last: "and discover more.",
  },
  {
    first: "Read the stories.",
    highlight: "Explore the worlds.",
    last: "Play the games.",
  },
];


  const [currentIntro, setCurrentIntro] = useState(() => {
    return menuIntros[Math.floor(Math.random() * menuIntros.length)];
  });

  useEffect(() => {
    if (isOpen) {
      const randomIntro =
        menuIntros[Math.floor(Math.random() * menuIntros.length)];

      setCurrentIntro(randomIntro);
      setActiveMenu("main");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const closeMenu = () => {
    setActiveMenu("main");
    onClose();
  };

  const openSubmenu = (menu) => {
    setActiveMenu(menu);
  };

  const goBack = () => {
    setActiveMenu("main");
  };

  return createPortal(
    <div className="bf-editorial-menu">

      {/* BACKDROP */}
      <div
        className="bf-editorial-menu__overlay"
        onClick={closeMenu}
      />

      {/* MENU */}
      <aside
        className="bf-editorial-menu__panel"
        onClick={(event) => event.stopPropagation()}
      >

        {/* HEADER */}
        <header className="bf-editorial-menu__header">

          <div className="bf-editorial-menu__logo">

          </div>

          <button
            type="button"
            className="bf-editorial-menu__close"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <span />
            <span />
          </button>

        </header>

        {/* =====================================================
            MAIN MENU
        ====================================================== */}

        {activeMenu === "main" && (
          <div className="bf-editorial-menu__content">

            <div className="bf-editorial-menu__intro">
              <h2>
                {currentIntro.first}
                <br />
                <em className="text-[var(--secondary-color)] dark:text-[var(--secondary-color)]">
                  {currentIntro.highlight}
                </em>
                <br />
                {currentIntro.last}
              </h2>
            </div>

            <nav className="bf-editorial-menu__navigation">

              {/* HOME */}
              <NavLink
                to="/"
                onClick={closeMenu}
                className="bf-editorial-menu__item"
              >
                <span className="bf-editorial-menu__label">
                  Home
                </span>
              </NavLink>

              {/* LIBRARY */}
              <button
                type="button"
                className="bf-editorial-menu__item"
                onClick={() => openSubmenu("library")}
              >
                <span className="bf-editorial-menu__label">
                  Library
                </span>

                <FaArrowRight />
              </button>

              {/* SERVICES */}
              <button
                type="button"
                disabled={!user}
                className={`bf-editorial-menu__item ${
                  !user ? "opacity-40 cursor-not-allowed" : ""
                }`}
                onClick={() => {
                  if (user) {
                    openSubmenu("services");
                  }
                }}
              >
                <span className="bf-editorial-menu__label">
                  Services
                </span>

                {user && <FaArrowRight />}
              </button>

              {/* TAKERS */}
              <NavLink
                to="/takers"
                onClick={closeMenu}
                className="bf-editorial-menu__item"
              >
                <span className="bf-editorial-menu__label">
                  Takers
                </span>
              </NavLink>

              {/* PREMIUM */}
              <NavLink
                to="/takers-premium"
                onClick={closeMenu}
                className="bf-editorial-menu__item"
              >
                <span className="bf-editorial-menu__label">
                  Premium
                </span>
              </NavLink>

              {/* CLUB */}
              <NavLink
                to="/club"
                onClick={closeMenu}
                className="bf-editorial-menu__item"
              >
                <span className="bf-editorial-menu__label">
                  HobbyFlow Club
                </span>
              </NavLink>

            </nav>

          </div>
        )}

        {/* =====================================================
            LIBRARY
        ====================================================== */}

        {activeMenu === "library" && (
          <div className="bf-editorial-menu__content bf-editorial-menu__subpage">

            <button
              type="button"
              className="bf-editorial-menu__back"
              onClick={goBack}
            >
              <FaArrowLeft />
              <span>Back</span>
            </button>

            <div className="bf-editorial-menu__subintro">
              {/* <h2>
                Explore
                <br />
                <em>Library.</em>
              </h2> */}
            </div>

            <nav className="bf-editorial-menu__subnavigation">

              {/* BOOKS */}
              <button
                type="button"
                onClick={() => openSubmenu("books")}
              >
                <strong>
                  Books
                </strong>

                <FaArrowRight />
              </button>

              {/* Comics & Games */}
              {/* Hobby Zone */}
              <button
                type="button"
                onClick={() => openSubmenu("others")}
              >
                <strong>
                  Hobby Zone
                </strong>

                <FaArrowRight />
              </button>

            </nav>

          </div>
        )}

        {/* =====================================================
            BOOKS
        ====================================================== */}

        {activeMenu === "books" && (
          <div className="bf-editorial-menu__content bf-editorial-menu__subpage">

            <button
              type="button"
              className="bf-editorial-menu__back"
              onClick={() => openSubmenu("library")}
            >
              <FaArrowLeft />
              <span>Library</span>
            </button>

            <div className="bf-editorial-menu__subintro">
              {/* <h2>
                Explore
                <br />
                <em>Books.</em>
              </h2> */}
            </div>

            <nav className="bf-editorial-menu__subnavigation">

              <NavLink
                to="/books"
                onClick={closeMenu}
              >
                <strong>
                  Books
                </strong>
              </NavLink>

              <NavLink
                to="/book-collections"
                onClick={closeMenu}
              >
                <strong>
                  Book Collections
                </strong>
              </NavLink>

            </nav>

          </div>
        )}

        {/* =====================================================
            Hobby Zone
        ====================================================== */}

        {activeMenu === "others" && (
          <div className="bf-editorial-menu__content bf-editorial-menu__subpage">

            <button
              type="button"
              className="bf-editorial-menu__back"
              onClick={() => openSubmenu("library")}
            >
              <FaArrowLeft />
              <span>Library</span>
            </button>

            <div className="bf-editorial-menu__subintro">
              {/* <h2>
                Explore
                <br />
                <em>Others.</em>
              </h2> */}
            </div>

            <nav className="bf-editorial-menu__subnavigation">

              <NavLink
                to="/comics"
                onClick={closeMenu}
              >
                <strong>
                  Comics
                </strong>
              </NavLink>

              <NavLink
                to="/board-games"
                onClick={closeMenu}
              >
                <strong>
                  Board Games
                </strong>
              </NavLink>

            </nav>

          </div>
        )}

        {/* =====================================================
            SERVICES
        ====================================================== */}

        {activeMenu === "services" && (
          <div className="bf-editorial-menu__content bf-editorial-menu__subpage">

            <button
              type="button"
              className="bf-editorial-menu__back"
              onClick={goBack}
            >
              <FaArrowLeft />
              <span>Back</span>
            </button>

            <div className="bf-editorial-menu__subintro">
            </div>

            <nav className="bf-editorial-menu__subnavigation">

              <NavLink
                to="/hobbyflow-reader"
                onClick={closeMenu}
              >
                <strong>
                  HobbyFlow Reader
                </strong>
              </NavLink>

            </nav>

          </div>
        )}

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <footer className="bf-editorial-menu__footer">

          {userProfile?.role === "admin" && (
            <NavLink
              to="/admin"
              onClick={closeMenu}
              className="bf-editorial-menu__admin mb-2"
            >
              <MdOutlineAdminPanelSettings className="text-2xl" />

              <span className="relative inline-flex items-center gap-2">
                Admin Panel

                {unreadSupportCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                )}
              </span>

              <FaArrowRight />
            </NavLink>
          )}

          <div className="bf-editorial-menu__theme">
            <ThemeToggle />
          </div>

        </footer>

      </aside>
    </div>,
    document.body
  );
};

export default MobileMenu;