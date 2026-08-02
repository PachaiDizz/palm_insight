// Prevent theme flash: apply light/dark class before React hydrates
(function () {
  try {
    var t = localStorage.getItem("palm-insight-theme");
    if (t !== "light" && t !== "dark") {
      t = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    var r = document.documentElement;
    r.classList.remove("light", "dark");
    r.classList.add(t);
  } catch (e) {}
})();
