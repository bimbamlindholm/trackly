import { useEffect, useState } from "react"

function InstallAppButton({ className = "custom-button" }) {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      window.navigator.standalone

    setIsStandalone(Boolean(standalone))

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setInstallPrompt(event)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      )
    }
  }, [])

  const installApp = async () => {
    if (!installPrompt) {
      alert(
        "Install is available from your browser menu once Trackly meets install requirements."
      )
      return
    }

    await installPrompt.prompt()
    await installPrompt.userChoice
    setInstallPrompt(null)
  }

  if (isStandalone) {
    return null
  }

  return (
    <button className={className} type="button" onClick={installApp}>
      Install Trackly
    </button>
  )
}

export default InstallAppButton
