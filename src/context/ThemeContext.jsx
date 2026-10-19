import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState("dark");

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );

    const applyTheme = () => {
      const systemTheme = mediaQuery.matches
        ? "dark"
        : "light";

      const actualTheme =
        theme === "system"
          ? systemTheme
          : theme;

      setResolvedTheme(actualTheme);

      document.documentElement.classList.toggle(
        "dark",
        actualTheme === "dark"
      );

      document.documentElement.style.colorScheme =
        actualTheme;
    };

    applyTheme();

    const handleSystemThemeChange = () => {
      if (theme === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener(
      "change",
      handleSystemThemeChange
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleSystemThemeChange
      );
    };
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  const toggleTheme = () => {
    const newTheme =
      resolvedTheme === "light"
        ? "dark"
        : "light";

    changeTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        changeTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () =>
  useContext(ThemeContext);