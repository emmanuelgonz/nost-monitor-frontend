import { TempusDominus } from "@eonasdan/tempus-dominus";
import $ from "jquery";
import { convertDateTimeToUTC } from "../utils";

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

$("#updateForm").on("submit", (e) => {
  e.preventDefault();
  // TODO: send start command
  console.log({
    tasking_parameters: {
      sim_update_time: convertDateTimeToUTC(
        updateTime.dates.lastPicked,
      ).toISOString(),
      time_scaling_factor: $("#updateTimeScale").val()
        ? Number.parseFloat($("#updateTimeScale").val())
        : null,
    },
  });
});

export { updateTime };
