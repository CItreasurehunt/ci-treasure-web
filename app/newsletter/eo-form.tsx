"use client";

import { useEffect } from "react";

export function EOSubscribeForm() {
  useEffect(() => {
    const container = document.getElementById("eo-newsletter-embed");
    if (!container) return;
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://eomail6.com/form/43810c6c-5e99-11f1-b945-2703b9a79d08.js";
    script.dataset.form = "43810c6c-5e99-11f1-b945-2703b9a79d08";
    container.appendChild(script);
    return () => script.remove();
  }, []);

  return <div id="eo-newsletter-embed" />;
}
