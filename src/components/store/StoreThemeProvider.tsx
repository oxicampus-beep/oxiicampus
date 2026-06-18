import { createContext, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type StoreTheme = "light" | "dark";

type StoreThemeContextValue = {
  theme: StoreTheme;
  isDark: boolean;
  toggleTheme: () => void;
};

const StoreThemeContext = createContext<StoreThemeContextValue | null>(null);

const STORAGE_KEY = "agent-store-theme";

export function StoreThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<StoreTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "dark" || saved === "light") return saved;
    } catch { /* ignore */ }
    return "light";
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === "light" ? "dark" : "light"));

  return (
    <StoreThemeContext.Provider value={{ theme, isDark: theme === "dark", toggleTheme }}>
      <div
        data-store-theme={theme}
        className={cn(
          "storefront min-h-screen transition-colors duration-200",
          theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-[#f8f9fb] text-zinc-900",
        )}
      >
        {children}
      </div>
    </StoreThemeContext.Provider>
  );
}

export function useStoreTheme() {
  const ctx = useContext(StoreThemeContext);
  if (!ctx) throw new Error("useStoreTheme must be used within StoreThemeProvider");
  return ctx;
}
