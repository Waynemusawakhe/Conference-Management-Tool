import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem("cmt-theme") === "dark");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("cmt-theme", dark ? "dark" : "light");
  }, [dark]);

  return <ThemeContext.Provider value={{ dark, toggleTheme: () => setDark((value) => !value) }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
