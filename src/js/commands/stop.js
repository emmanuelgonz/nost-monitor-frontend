import { TempusDominus } from "@eonasdan/tempus-dominus";
import $ from "jquery";
import { convertDateTimeToUTC } from "../utils";
import { amqpChannel, currentExchange } from "../main";

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
  const RABBITMQ_EXCHANGE = currentExchange || process.env.DEFAULT_RABBITMQ_EXCHANGE;
  const routingKey = `${RABBITMQ_EXCHANGE}.stop`;

  const message = {
    tasking_parameters: {
      sim_stop_time: convertDateTimeToUTC(
        stopTime.dates.lastPicked,
      ).toISOString(),
    },
  };

  if (amqpChannel) {
    try {
      await amqpChannel.basicPublish(
        RABBITMQ_EXCHANGE,
        routingKey,
        JSON.stringify(message)
      );
      console.log("Stop command sent:", message);
    } catch (err) {
      console.error("Failed to send stop command:", err);
    }
  } else {
    console.warn("AMQP channel not ready.");
  }
});

export { stopTime };