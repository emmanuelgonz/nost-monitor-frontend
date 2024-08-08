import { TempusDominus } from "@eonasdan/tempus-dominus";
import { convertDateTimeToUTC } from "../utils";
import { startInterval } from "./start";
import { stopTime } from "./stop";
import { updateTime } from "./update";

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

$("#initializeForm").on("submit", (e) => {
  e.preventDefault();
  // TODO: send initialize command
  console.log({
    tasking_parameters: {
      required_apps: $("#initializeRequiredApps")
        .val()
        .split(",")
        .map((s) => s.trim()),
      sim_start_time: convertDateTimeToUTC(
        initializeInterval.dates.picked[0],
      ).toISOString(),
      sim_stop_time: convertDateTimeToUTC(
        initializeInterval.dates.picked[1],
      ).toISOString(),
    },
  });
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
