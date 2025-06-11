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

  // console.log("RABBITMQ_HOST:", RABBITMQ_HOST);
  // console.log("RABBITMQ_RELAY_PORT:", RABBITMQ_RELAY_PORT);
  // console.log("RABBITMQ_EXCHANGE:", RABBITMQ_EXCHANGE);
  // console.log("TLS enabled:", tls);

  const url = `${tls ? "wss" : "ws"}://${RABBITMQ_HOST}:${RABBITMQ_RELAY_PORT}`;

  console.log("Connecting to AMQP broker at:", url);

  const amqp = new AMQPWebSocketClient(url, "/", "", accessToken);
  console.log("AMQP client created with access token:", accessToken);
  console.log("AMQP client version:", amqp.version);
  console.log("AMQP client user agent:", amqp.userAgent);
  console.log("AMQP client TLS enabled:", amqp.tlsEnabled);
  console.log("AMQP client TLS version:", amqp.tlsVersion);
  console.log("AMQP client TLS cipher:", amqp.tlsCipher);
  console.log("AMQP client TLS session ID:", amqp.tlsSessionId);
  console.log("AMQP client TLS peer certificate:", amqp.tlsPeerCertificate);
  console.log("AMQP client TLS peer certificate subject:", amqp.tlsPeerCertificateSubject);
  console.log("AMQP client TLS peer certificate issuer:", amqp.tlsPeerCertificateIssuer);

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