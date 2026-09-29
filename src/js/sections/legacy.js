// @ts-check

export function initLegacy() {
  const gallery = document.getElementById("legacy-gallery");
  const lightbox = /** @type {HTMLDialogElement | null} */ (document.getElementById("legacy-lightbox"));
  const lightboxImg = /** @type {HTMLImageElement | null} */ (document.getElementById("lightbox-img"));
  const lightboxCaption = document.getElementById("lightbox-caption");
  const closeBtn = document.getElementById("lightbox-close-btn");

  if (!gallery || !lightbox) return;

  // Open lightbox on card click
  gallery.querySelectorAll(".polaroid-frame").forEach((frame) => {
    frame.addEventListener("click", () => {
      const img = frame.querySelector("img");
      const caption = frame.querySelector(".polaroid-caption");
      
      if (img && lightboxImg) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || "VJTI Cricket Legacy";
      }
      if (caption && lightboxCaption) {
        lightboxCaption.textContent = caption.textContent;
      }
      
      lightbox.showModal();
    });
  });

  // Close handlers
  if (closeBtn) {
    closeBtn.addEventListener("click", () => lightbox.close());
  }

  // Backdrop click to close
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      lightbox.close();
    }
  });

  // Keyboard navigation (Esc handles natively in <dialog>)
}
