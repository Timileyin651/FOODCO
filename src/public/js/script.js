// FoodCo scroll-reveal.
// Tells the CSS that this script loaded (turns off the 2s failsafe in styles.css).
document.documentElement.classList.add("ready");

const items = document.querySelectorAll(".reveal");

// Stagger cards within each shelf (CSS uses --i for the transition delay)
document.querySelectorAll(".grid").forEach((grid) => {
  grid.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.setProperty("--i", i);
  });
});

if (!("IntersectionObserver" in window)) {
  // Very old browsers: just show everything
  items.forEach((el) => el.classList.add("in"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
  );
  items.forEach((el) => io.observe(el));
}
