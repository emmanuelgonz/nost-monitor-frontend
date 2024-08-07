// Import our custom CSS
import '../scss/styles.scss'

// Import all of Bootstrap's JS
import * as bootstrap from 'bootstrap'

import mqtt from "mqtt";

import {
  Viewer,
  Ion,
  Terrain,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// CesiumJS has a default access token built in but it's not meant for active use.
// please set your own access token can be found at: https://cesium.com/ion/tokens.
Ion.defaultAccessToken = process.env.CESIUM_TOKEN;

// Other environment variables
$("#loginPrefix").val(process.env.DEFAULT_PREFIX);
$("#loginUsername").val(process.env.DEFAULT_USERNAME);
$("#loginPassword").val(process.env.DEFAULT_PASSWORD);
$("#loginHostname").val(process.env.DEFAULT_HOSTNAME);
$("#loginPort").val(process.env.DEFAULT_PORT);

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Viewer("cesiumContainer", {
  terrain: Terrain.fromWorldTerrain(),
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
});

const loginModal = new bootstrap.Modal(document.getElementById("loginModal"))
loginModal.show();

$("#initializeForm").on("submit", (e) => {
  e.preventDefault();
  // TODO: send initialize command
});

$("#loginForm").on("submit", (e) => {
  e.preventDefault();
  // TODO: authenticate credentials
  const username = $("#loginUsername").val();
  const password = $("#loginPassword").val();
  const hostname = $("#loginHostname").val();
  const port = parseInt($("#loginPort").val());
  const encrypted = $("#loginEncrypted").prop("checked");
  const connectionString = "mqtt" + (encrypted ? "s" : "") + "://" + hostname + ":" + port;
  let client = mqtt.connect(
    connectionString, 
    {
      username: username,
      password: password,
      reconnectPeriod: 0, 
      connectTimeout: 1000, 
      rejectUnauthorized: false
    }
  );
  client.on("error", (error) => {
    console.log(error);
    loginModal.hide();
  });
  client.on("connect", () => {
    client.subscribe($("#loginPrefix").val(), (err) => {
      if(!err) {
        client.on
        client.publish($("#loginPrefix").val(), "Monitor (" + $("#loginUsername").val() + ") connected.");
      }
    });
    loginModal.hide();
    $("#navLogin").hide();
    $("#navLogout").text("Logout " + $("#loginUsername").val() + " (" + $("#loginPrefix").val() + ")");
    $("#navLogout").show();
  });
  client.on("message", (topic, message) => {
    $("#logsContainer").prepend($('<div class="card"><div class="card-body"><h5 class="card-title">' + new Date().toISOString() + '</h5><h6 class="card-subtitle text-muted">' + topic + '</h6><p class="card-text font-monospace">' + message + '</p></div></div>'));
  });
});

$("#navLogout").on("click", (e) => {
  $("#navLogout").text("Logout");
  $("#navLogout").hide();
  $("#navLogin").show();
});

//  // import namespace "mqtt"
// let client = mqtt.connect("ws://test.mosquitto.org:8080"); // create a client

// client.on("connect", () => {
//   client.subscribe("presence", (err) => {
//     if (!err) {
//       client.publish("presence", "Hello mqtt");
//     }
//   });
// });

// client.on("message", (topic, message) => {
//   // message is Buffer
//   console.log(message.toString());
//   client.end();
// });

import { TempusDominus } from '@eonasdan/tempus-dominus'; 

const initializeStartPicker = new TempusDominus(document.getElementById('initializeStart'), {
  display: {
    icons: {
      time: 'bi bi-clock',
      date: 'bi bi-calendar',
      up: 'bi bi-arrow-up',
      down: 'bi bi-arrow-down',
      previous: 'bi bi-chevron-left',
      next: 'bi bi-chevron-right',
      today: 'bi bi-calendar-check',
      clear: 'bi bi-trash',
      close: 'bi bi-x',
    },
    sideBySide: true,
    buttons: {
      close: true,
    },
  }
});
const initializeEndPicker = new TempusDominus(document.getElementById('initializeEnd'), {
  display: {
    icons: {
      time: 'bi bi-clock',
      date: 'bi bi-calendar',
      up: 'bi bi-arrow-up',
      down: 'bi bi-arrow-down',
      previous: 'bi bi-chevron-left',
      next: 'bi bi-chevron-right',
      today: 'bi bi-calendar-check',
      clear: 'bi bi-trash',
      close: 'bi bi-x',
    },
    sideBySide: true,
    buttons: {
      close: true,
    },
  }
});
