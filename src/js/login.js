import * as bootstrap from "bootstrap";
import $ from "jquery";
import Keycloak from "keycloak-js";
import { connect } from "./main";

// Keycloak configuration for user authentication
const KEYCLOAK_HOST = process.env.DEFAULT_KEYCLOAK_HOST;
const KEYCLOAK_PORT = process.env.DEFAULT_KEYCLOAK_PORT;
const KEYCLOAK_REALM = process.env.DEFAULT_KEYCLOAK_REALM;
const KEYCLOAK_CLIENT_ID = process.env.DEFAULT_KEYCLOAK_CLIENT_ID;

// console.log('KEYCLOAK_HOST:', KEYCLOAK_HOST);
// console.log('KEYCLOAK_PORT:', KEYCLOAK_PORT);
// console.log('KEYCLOAK_REALM:', KEYCLOAK_REALM);
// console.log('KEYCLOAK_CLIENT_ID:', KEYCLOAK_CLIENT_ID);

const keycloak = new Keycloak({
  url: `https://${KEYCLOAK_HOST}:${KEYCLOAK_PORT}/`,
  realm: KEYCLOAK_REALM,
  clientId: KEYCLOAK_CLIENT_ID,
});

keycloak
  .init({ onLoad: "login-required" })
  .then(function (authenticated) {
    if (authenticated) {
      startApplication();
    } else {
      console.error("User not authenticated");
    }
  })
  .catch(function () {
    console.error("Failed to initialize Keycloak");
  });

function startApplication() {
  // Optionally, set user info in the UI
  $("#navLogin").hide();
  $("#navLogout")
    .text("Logout " + keycloak.tokenParsed.preferred_username)
    .show();

  console.log("User authenticated:", keycloak.tokenParsed.preferred_username);
  console.log("Access Token:", keycloak.token);
  // Connect to AMQP using the access token
  connect(keycloak.token);

  // Logout handler
  $("#navLogout").on("click", () => {
    keycloak.logout();
    $("#navLogout").text("Logout").hide();
    $("#navLogin").show();
  });
}