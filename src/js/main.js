// Import our custom CSS
import "../scss/styles.scss";

import mqtt from "mqtt";

let client = null;

function connect(connectionString, username, password, callback) {
  client = mqtt.connect(connectionString, {
    username: username,
    password: password,
    reconnectPeriod: 0,
    connectTimeout: 1000,
    rejectUnauthorized: false,
  });
  client.on("error", callback);
  client.on("connect", () => {
    client.subscribe($("#loginPrefix").val(), (err) => {
      if (!err) {
        client.publish(
          $("#loginPrefix").val(),
          "Monitor (" + $("#loginUsername").val() + ") connected.",
        );
      }
      callback();
    });
    client.on("message", (topic, message) => {
      $("#logsContainer").prepend(
        $(
          '<div class="card"><div class="card-body"><h5 class="card-title">' +
            new Date().toISOString() +
            '</h5><h6 class="card-subtitle text-muted">' +
            topic +
            '</h6><p class="card-text font-monospace">' +
            message +
            "</p></div></div>",
        ),
      );
    });
  });
}

export { client, connect };
