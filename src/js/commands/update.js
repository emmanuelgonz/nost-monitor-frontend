import { TempusDominus } from "@eonasdan/tempus-dominus";
import $ from "jquery";
import { convertDateTimeToUTC } from "../utils";
import { currentExchange } from "../main";
import { apiPost } from "../api";
import { showError, showSuccess } from "../notify";

const updateTime = new TempusDominus(document.getElementById("updateTime"), {
  display: {
    icons: {
      time: "bi bi-clock",
      date: "bi bi-calendar",
      up: "bi bi-arrow-up",
      down: "bi bi-arrow-down",
      previous: "bi bi-chevron-left",
      next: "bi bi-chevron-right",
      today: "bi bi-calendar-check",
      clear: "bi bi-trash",
      close: "bi bi-x",
    },
    sideBySide: true,
    buttons: {
      close: true,
    },
  },
});

$("#updateForm").on("submit", async (e) => {
  e.preventDefault();
  const prefix = currentExchange || process.env.DEFAULT_RABBITMQ_EXCHANGE;

  if (!$("#updateTimeScale").val()) {
    showError("Update command requires a time scale factor.");
    return;
  }

  const body = {
    timeScaleFactor: Number.parseFloat($("#updateTimeScale").val()),
    simUpdateTime: convertDateTimeToUTC(updateTime.dates.lastPicked).toISOString(),
  };

  try {
    await apiPost(`/update/${prefix}`, body);
    console.log("Update command sent:", body);
    showSuccess(`Update command sent for '${prefix}'.`);
  } catch (err) {
    console.error("Failed to send update command:", err);
    showError(`Update failed: ${err.message}`);
  }
});

export { updateTime };