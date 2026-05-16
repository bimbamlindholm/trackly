import {
  useState,
  useEffect,
} from "react"
import { ThemeContext } from "./themeContextValue"

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return (
      localStorage.getItem(
        "trackly-theme"
      ) || "dark"
    )
  })

  useEffect(() => {
    localStorage.setItem(
      "trackly-theme",
      theme
    )

    document.body.className = theme
  }, [theme])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
