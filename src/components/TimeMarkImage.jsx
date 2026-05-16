import { useEffect, useState } from "react"

import { supabase } from "../services/supabaseClient"

function TimeMarkImage({ src, alt, className = "record-photo" }) {
  const [imageUrl, setImageUrl] = useState(src || "")

  useEffect(() => {
    let active = true

    const loadImage = async () => {
      if (!src) {
        setImageUrl("")
        return
      }

      if (!src.startsWith("storage:")) {
        setImageUrl(src)
        return
      }

      const path = src.replace("storage:", "")
      const { data, error } = await supabase.storage
        .from("time-mark-photos")
        .createSignedUrl(path, 60 * 60)

      if (!active) return

      setImageUrl(error ? "" : data.signedUrl)
    }

    loadImage()

    return () => {
      active = false
    }
  }, [src])

  if (!imageUrl) return null

  return <img className={className} src={imageUrl} alt={alt} />
}

export default TimeMarkImage
