import { Toast } from "bootstrap";

function showToast(message, variant, delayMs) {
  const container = document.getElementById("toastContainer");
  if (!container) {
    console.warn("toastContainer element missing");
    return;
  }

  const el = document.createElement("div");
  el.className = `toast align-items-center text-bg-${variant} border-0`;
  el.setAttribute("role", variant === "danger" ? "alert" : "status");
  el.setAttribute("aria-live", variant === "danger" ? "assertive" : "polite");
  el.setAttribute("aria-atomic", "true");
  el.innerHTML = `
    <div class="d-flex">
      <div class="toast-body"></div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast" aria-label="Close"></button>
    </div>`;
  el.querySelector(".toast-body").textContent = message;
  container.appendChild(el);

  const toast = new Toast(el, { autohide: true, delay: delayMs });
  el.addEventListener("hidden.bs.toast", () => el.remove());
  toast.show();
}

export function showError(message) {
  showToast(message, "danger", 8000);
}

export function showSuccess(message) {
  showToast(message, "success", 4000);
}
