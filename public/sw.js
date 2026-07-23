// Minimal service worker — exists only to satisfy the installability
// requirement (a registered SW with a fetch handler) behind Chrome/Android's
// automatic "Install app" prompt. Deliberately does no caching: this is a
// live-data calendar site, so serving stale event listings offline isn't
// worth the complexity. Just passes every request straight through.
self.addEventListener("fetch", () => {});
