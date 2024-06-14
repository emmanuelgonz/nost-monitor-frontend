// Import our custom CSS
import '../scss/styles.scss'

// Import all of Bootstrap's JS
import * as bootstrap from 'bootstrap'

import {
  Viewer,
  Ion,
  Terrain,
} from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// CesiumJS has a default access token built in but it's not meant for active use.
// please set your own access token can be found at: https://cesium.com/ion/tokens.
Ion.defaultAccessToken = process.env.CESIUM_TOKEN;

// Initialize the Cesium Viewer in the HTML element with the `cesiumContainer` ID.
const viewer = new Viewer("cesiumContainer", {
  terrain: Terrain.fromWorldTerrain(),
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
});

import mqtt from "mqtt"; // import namespace "mqtt"
let client = mqtt.connect("ws://test.mosquitto.org:8080"); // create a client

client.on("connect", () => {
  client.subscribe("presence", (err) => {
    if (!err) {
      client.publish("presence", "Hello mqtt");
    }
  });
});

client.on("message", (topic, message) => {
  // message is Buffer
  console.log(message.toString());
  client.end();
});

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
