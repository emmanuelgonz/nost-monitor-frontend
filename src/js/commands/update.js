import { TempusDominus } from "@eonasdan/tempus-dominus";
import $ from "jquery";
import { convertDateTimeToUTC } from "../utils";
import { amqpChannel } from "../main";

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
  const RABBITMQ_EXCHANGE = process.env.DEFAULT_RABBITMQ_EXCHANGE;
  const routingKey = `${RABBITMQ_EXCHANGE}.update`;

  const message = {
    tasking_parameters: {
      sim_update_time: convertDateTimeToUTC(
        updateTime.dates.lastPicked,
      ).toISOString(),
      time_scaling_factor: $("#updateTimeScale").val()
        ? Number.parseFloat($("#updateTimeScale").val())
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
      console.log("Update command sent:", message);
    } catch (err) {
      console.error("Failed to send update command:", err);
    }
  } else {
    console.warn("AMQP channel not ready.");
  }
});

export { updateTime };