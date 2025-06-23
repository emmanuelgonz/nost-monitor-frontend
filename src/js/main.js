import "../scss/styles.scss";
import $ from "jquery";
import { AMQPWebSocketClient } from "@cloudamqp/amqp-client";

let amqpConn = null;
let amqpChannel = null;
let amqp = null;
let userExchange = null;

function setUserExchange(exchange) {
  userExchange = exchange;
}

async function connect(accessToken) {

  // Use userExchange if set, otherwise fallback to env
  const RABBITMQ_EXCHANGE = userExchange || process.env.DEFAULT_RABBITMQ_EXCHANGE;
  const tls = window.location.protocol === "https:";
  const url = `${tls ? "wss" : "ws"}://${RABBITMQ_HOST}:${RABBITMQ_RELAY_PORT}`;

  amqp = new AMQPWebSocketClient(url, "/", "", accessToken);
  try {
    amqpConn = await amqp.connect();
    amqpChannel = await amqpConn.channel();
    await amqpChannel.exchangeDeclare(RABBITMQ_EXCHANGE, "topic", {
      durable: true,
      autoDelete: true,
    });
    const q = await amqpChannel.queue("", { exclusive: true });
    await q.bind(RABBITMQ_EXCHANGE, `${RABBITMQ_EXCHANGE}.#`);
    await q.subscribe({ noAck: true }, (msg) => {
      const topic = msg.routingKey;
      const payload = JSON.parse(msg.bodyToString());
      handleMessage(topic, payload);
    });
    console.log("Connected to AMQP broker.");
  } catch (err) {
    console.error("Error during AMQP setup:", err);
  }
}

// Allow updating the token on refresh
function updateAmqpToken(newToken) {
  if (amqpConn && typeof amqpConn.updateSecret === "function") {
    amqpConn.updateSecret(newToken);
    console.log("AMQP token updated via updateSecret.");
  } else if (amqp && typeof amqp.updateSecret === "function") {
    amqp.updateSecret(newToken);
    console.log("AMQP token updated via amqp.updateSecret.");
  } else {
    console.warn("AMQP connection not established or updateSecret not available.");
  }
}

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

export { amqpConn, amqpChannel, connect, updateAmqpToken, userExchange, setUserExchange };