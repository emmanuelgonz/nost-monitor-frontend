import "../scss/styles.scss";
import $ from "jquery";
import { AMQPWebSocketClient } from "@cloudamqp/amqp-client";

// Store connection and channel globally if needed
let amqpConn = null;
let amqpChannel = null;

async function connect(accessToken) {
  // Load environment variables
  const RABBITMQ_HOST = process.env.DEFAULT_RABBITMQ_HOST;
  const RABBITMQ_RELAY_PORT = process.env.DEFAULT_RABBITMQ_RELAY_PORT;
  const RABBITMQ_EXCHANGE = process.env.DEFAULT_RABBITMQ_EXCHANGE;
  const tls = window.location.protocol === "https:";
  const url = `${tls ? "wss" : "ws"}://${RABBITMQ_HOST}:${RABBITMQ_RELAY_PORT}`;

  const amqp = new AMQPWebSocketClient(url, "/", "", accessToken);

  try {
    amqpConn = await amqp.connect();
    amqpChannel = await amqpConn.channel();
    await amqpChannel.exchangeDeclare(RABBITMQ_EXCHANGE, "topic", {
      durable: false,
      autoDelete: true,
    });
    const q = await amqpChannel.queue("", { exclusive: true });
    await q.bind(RABBITMQ_EXCHANGE, `${RABBITMQ_EXCHANGE}.#`);
    await q.subscribe({ noAck: true }, (msg) => {
      const topic = msg.routingKey;
      const payload = JSON.parse(msg.bodyToString());
      handleMessage(topic, payload);
    });
    // Optionally, start token refresh here if needed
    console.log("Connected to AMQP broker.");
  } catch (err) {
    console.error("Error during AMQP setup:", err);
  }
}

// Example message handler (customize as needed)
function handleMessage(topic, payload) {
  $("#logsContainer").prepend(
    $(
      '<div class="card"><div class="card-body"><h5 class="card-title">' +
        new Date().toISOString() +
        '</h5><h6 class="card-subtitle text-muted">' +
        topic +
        '</h6><p class="card-text font-monospace">' +
        JSON.stringify(payload) +
        "</p></div></div>"
    )
  );
}

export { amqpConn, connect };