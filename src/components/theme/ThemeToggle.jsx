import { FaSun, FaMoon, FaDesktop } from "react-icons/fa";
import { GrSystem } from "react-icons/gr";

import { useTheme } from "../../context/ThemeContext";

import "./themeToggle.scss";

const ThemeToggle = ({ className = "" }) => {
  const {
    theme,
    changeTheme,
  } = useTheme();

  return (
    <div
      className={`theme-switcher ${className}`}
      role="group"
      aria-label="Theme selection"
    >
      {/* LIGHT */}
      <button
        type="button"
        className={`theme-switcher__option ${
          theme === "light"
            ? "theme-switcher__option--active"
            : ""
        }`}
        onClick={() => changeTheme("light")}
        aria-label="Light theme"
        aria-pressed={theme === "light"}
      >
        <FaSun />

        <span>Light</span>
      </button>

      {/* DARK */}
      <button
        type="button"
        className={`theme-switcher__option ${
          theme === "dark"
            ? "theme-switcher__option--active"
            : ""
        }`}
        onClick={() => changeTheme("dark")}
        aria-label="Dark theme"
        aria-pressed={theme === "dark"}
      >
        <FaMoon />

        <span>Dark</span>
      </button>

      {/* SYSTEM */}
      <button
        type="button"
        className={`theme-switcher__option ${
          theme === "system"
            ? "theme-switcher__option--active"
            : ""
        }`}
        onClick={() => changeTheme("system")}
        aria-label="System theme"
        aria-pressed={theme === "system"}
      >
        <GrSystem />

        <span>System</span>
      </button>
    </div>
  );
};

export default ThemeToggle;