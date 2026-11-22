"use strict";

// A local file browser needs the filename that an HTTP server supplies for a directory.
window.ps2Page = (path) => location.protocol === "file:" ? path + "index.html" : path;

document.addEventListener("DOMContentLoaded", () => {
  for (const link of document.querySelectorAll('a[href^="./"], a[href^="../"]')) {
    const [path, fragment] = link.getAttribute("href").split("#", 2);
    if (path.endsWith("/")) link.setAttribute("href", window.ps2Page(path) + (fragment ? "#" + fragment : ""));
  }

  const redirect = document.querySelector("[data-legacy-target]");
  if (redirect) {
    const about = location.hash === "#about";
    const destination = new URL(about ? document.querySelector("[data-legacy-about]").href : redirect.href);
    destination.search = location.search;
    if (!about) destination.hash = location.hash;
    location.replace(destination);
  } else if (location.hash === "#about" && document.querySelector(".brand[aria-current=page]")) {
    location.replace(document.querySelector(".about-link").href);
  } else if (location.hash) {
    const fragment = location.hash.slice(1);
    const moved = Array.from(document.querySelectorAll("[data-legacy-fragments]"))
      .find((link) => link.dataset.legacyFragments.split(" ").includes(fragment));
    if (moved) {
      const destination = new URL(moved.href);
      destination.search = location.search;
      destination.hash = location.hash;
      location.replace(destination);
    }
  }
});
