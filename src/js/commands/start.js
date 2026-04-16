import { TempusDominus } from "@eonasdan/tempus-dominus";
import $ from "jquery";
import { convertDateTimeToUTC } from "../utils";
import { currentExchange } from "../main";
import { apiPost } from "../api";
import { showError, showSuccess } from "../notify";

const startInterval = new TempusDominus(
  document.getElementById("startInterval"),
  {
    dateRange: true,
    multipleDatesSeparator: " - ",
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
  },
);

const startTime = new TempusDominus(document.getElementById("startTime"), {
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

$("#startForm").on("submit", async (e) => {
  e.preventDefault();
  const prefix = currentExchange || process.env.DEFAULT_RABBITMQ_EXCHANGE;

  const body = {
    simStartTime: convertDateTimeToUTC(
      startInterval.dates.picked[0],
    ).toISOString(),
    simStopTime: convertDateTimeToUTC(
      startInterval.dates.picked[1],
    ).toISOString(),
  };
  if (startTime.dates.lastPicked) {
    body.startTime = convertDateTimeToUTC(startTime.dates.lastPicked).toISOString();
  }
  if ($("#startTimeScale").val()) {
    body.timeScaleFactor = Number.parseFloat($("#startTimeScale").val());
  }

  try {
    await apiPost(`/start/${prefix}`, body);
    console.log("Start command sent:", body);
    showSuccess(`Start command sent for '${prefix}'.`);
  } catch (err) {
    console.error("Failed to send start command:", err);
    showError(`Start failed: ${err.message}`);
  }
});

export { startInterval };