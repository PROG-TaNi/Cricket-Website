// @ts-check

/**
 * Accessible Vanilla Toast notification manager with aria-live="polite" and Undo action slot.
 */
class ToastManager {
  constructor() {
    /** @type {HTMLElement | null} */
    this.container = null;
    this.init();
  }

  init() {
    if (typeof document === "undefined") return;
    let existing = document.getElementById("vjti-toast-container");
    if (!existing) {
      existing = document.createElement("div");
      existing.id = "vjti-toast-container";
      existing.setAttribute("role", "region");
      existing.setAttribute("aria-label", "Notifications");
      existing.setAttribute("aria-live", "polite");
      existing.className = "fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4";
      document.body.appendChild(existing);
    }
    this.container = existing;
  }

  /**
   * Show a toast message
   * @param {Object} options
   * @param {string} options.message
   * @param {"info" | "success" | "error" | "warning"} [options.type="info"]
   * @param {number} [options.duration=4000]
   * @param {{ label: string, onClick: () => void }} [options.action]
   */
  show({ message, type = "info", duration = 4000, action }) {
    if (!this.container) this.init();
    if (!this.container) return;

    const toast = document.createElement("div");
    toast.className = `pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-3 opacity-0 ${
      type === "success"
        ? "bg-[#0b1b12]/95 border-[#159957]/50 text-white"
        : type === "error"
        ? "bg-[#1f0a0c]/95 border-[#b5121b]/50 text-white"
        : "bg-[#0d1410]/95 border-white/10 text-white"
    }`;

    // Icon & Message
    const content = document.createElement("div");
    content.className = "flex items-center gap-2.5 text-sm font-medium";
    
    const dot = document.createElement("span");
    dot.className = `w-2 h-2 rounded-full flex-shrink-0 ${
      type === "success" ? "bg-[#31d47b]" : type === "error" ? "bg-[#b5121b]" : "bg-white/60"
    }`;
    content.appendChild(dot);

    const text = document.createElement("span");
    text.textContent = message;
    content.appendChild(text);

    toast.appendChild(content);

    // Optional Action Button (e.g. Undo, Retry)
    if (action) {
      const actionBtn = document.createElement("button");
      actionBtn.type = "button";
      actionBtn.className = "text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[#31d47b] transition-colors";
      actionBtn.textContent = action.label;
      actionBtn.addEventListener("click", () => {
        action.onClick();
        this.dismiss(toast);
      });
      toast.appendChild(actionBtn);
    }

    this.container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove("translate-y-3", "opacity-0");
    });

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(toast);
      }, duration);
    }
  }

  /**
   * @param {HTMLElement} toast
   */
  dismiss(toast) {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }
}

export const toast = new ToastManager();
