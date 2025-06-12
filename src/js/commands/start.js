import { TempusDominus } from "@eonasdan/tempus-dominus";
import $ from "jquery";
import { convertDateTimeToUTC } from "../utils";
import { amqpChannel } from "../main";

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
  const RABBITMQ_EXCHANGE = process.env.DEFAULT_RABBITMQ_EXCHANGE;
  const routingKey = `${RABBITMQ_EXCHANGE}.start`;

  const message = {
    tasking_parameters: {
      sim_start_time: convertDateTimeToUTC(
        startInterval.dates.picked[0],
      ).toISOString(),
      sim_stop_time: convertDateTimeToUTC(
        startInterval.dates.picked[1],
      ).toISOString(),
      start_time: startTime.dates.lastPicked
        ? convertDateTimeToUTC(startTime.dates.lastPicked).toISOString()
        : null,
      time_scaling_factor: $("#startTimeScale").val()
        ? Number.parseFloat($("#startTimeScale").val())
        : null,
    },
  };

  if (amqpChannel) {
    try {
      await amqpChannel.basicPublish(
        RABBITMQ_EXCHANGE,
        routingKey,
        JSON.stringify(message)
      );
      console.log("Start command sent:", message);
    } catch (err) {
      console.error("Failed to send start command:", err);
    }
  } else {
    console.warn("AMQP channel not ready.");
  }
});

export { startInterval };