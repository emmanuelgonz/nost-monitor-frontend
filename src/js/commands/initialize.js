import { TempusDominus } from "@eonasdan/tempus-dominus";
import $ from "jquery";
import { convertDateTimeToUTC } from "../utils";
import { startInterval } from "./start";
import { stopTime } from "./stop";
import { updateTime } from "./update";
import { currentExchange } from "../main";
import { apiPost } from "../api";

const initializeInterval = new TempusDominus(
  document.getElementById("initializeInterval"),
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

$("#initializeForm").on("submit", async (e) => {
  e.preventDefault();
  const prefix = currentExchange || process.env.DEFAULT_RABBITMQ_EXCHANGE;

  const body = {
    simStartTime: convertDateTimeToUTC(
      initializeInterval.dates.picked[0],
    ).toISOString(),
    simStopTime: convertDateTimeToUTC(
      initializeInterval.dates.picked[1],
    ).toISOString(),
    requiredApps: $("#initializeRequiredApps")
      .val()
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };

  try {
    await apiPost(`/init/${prefix}`, body);
    console.log("Initialize command sent:", body);
  } catch (err) {
    console.error("Failed to send initialize command:", err);
  }

  startInterval.updateOptions({
    restrictions: {
      minDate: initializeInterval.dates.picked[0],
      maxDate: initializeInterval.dates.picked[1],
    },
  });
  startInterval.dates.clear();
  startInterval.dates.setValue(initializeInterval.dates.picked[0], 0);
  startInterval.dates.setValue(initializeInterval.dates.picked[1], 1);
  updateTime.updateOptions({
    restrictions: {
      minDate: initializeInterval.dates.picked[0],
      maxDate: initializeInterval.dates.picked[1],
    },
  });
  stopTime.updateOptions({
    restrictions: {
      minDate: initializeInterval.dates.picked[0],
      maxDate: initializeInterval.dates.picked[1],
    },
  });
});
