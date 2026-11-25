// Prevent theme flash: apply the app theme before React hydrates.
// The app defaults to DARK on every device (desktop + mobile) so the mobile
// view matches the website instead of following the phone's light OS theme.
// Users can still explicitly switch to light in Settings; that choice is
// stored under the v2 key. The old v1 key (auto-selected from the OS) is
// intentionally ignored so previously auto-saved "light" devices reset to dark.
(function () {
  try {
    var t = localStorage.getItem("palm-insight-theme-v2");
    if (t !== "light" && t !== "dark") {
      t = "dark";
    }
    var r = document.documentElement;
    r.classList.remove("light", "dark");
    r.classList.add(t);
  } catch (e) {}
})();
