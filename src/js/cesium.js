import { Viewer, Ion, Terrain } from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";

// load cesium access token
Ion.defaultAccessToken = process.env.CESIUM_TOKEN;

// initialize cesium viewer
// const viewer = new Viewer("cesiumContainer", {
//   terrain: Terrain.fromWorldTerrain(),
//   baseLayerPicker: false,
//   geocoder: false,
//   homeButton: false,
//   sceneModePicker: false,
//   navigationHelpButton: false,
// });
const viewer = new Viewer('cesiumContainer');

// Handle window resize
window.addEventListener('resize', () => {
  viewer.resize();
});

export { viewer };