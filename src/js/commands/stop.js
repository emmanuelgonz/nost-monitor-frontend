import { TempusDominus } from "@eonasdan/tempus-dominus";
import $ from "jquery";
import { convertDateTimeToUTC } from "../utils";
import { currentExchange } from "../main";
import { apiPost } from "../api";

const stopTime = new TempusDominus(document.getElementById("stopTime"), {
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

$("#stopForm").on("submit", async (e) => {
  e.preventDefault();
  const prefix = currentExchange || process.env.DEFAULT_RABBITMQ_EXCHANGE;

  const body = {
    simStopTime: convertDateTimeToUTC(stopTime.dates.lastPicked).toISOString(),
  };

  try {
    await apiPost(`/stop/${prefix}`, body);
    console.log("Stop command sent:", body);
  } catch (err) {
    console.error("Failed to send stop command:", err);
  }
});

export { stopTime };