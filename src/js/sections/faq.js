// @ts-check

export function initFaq() {
  const faqItems = document.querySelectorAll("details[name='faq']");

  faqItems.forEach((detailsEl) => {
    const details = /** @type {HTMLDetailsElement} */ (detailsEl);
    const summary = details.querySelector("summary");
    const content = details.querySelector(".faq-content");

    if (!summary || !content) return;

    summary.addEventListener("click", (e) => {
      // Toggle rotation icon classes
      const icon = summary.querySelector(".faq-icon");
      if (icon) {
        if (!details.open) {
          icon.classList.add("rotate-180");
        } else {
          icon.classList.remove("rotate-180");
        }
      }
    });
  });
}
