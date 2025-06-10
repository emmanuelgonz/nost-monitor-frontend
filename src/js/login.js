import * as bootstrap from "bootstrap";
import $ from "jquery";
import Keycloak from "keycloak-js";
import { connect } from "./main";

// Keycloak configuration for user authentication
const KEYCLOAK_HOST = process.env.KEYCLOAK_HOST;
const KEYCLOAK_PORT = process.env.KEYCLOAK_PORT;
const url = `https://${KEYCLOAK_HOST}:${KEYCLOAK_PORT}`;

const keycloak = new Keycloak({
  url: url,
  realm: process.env.KEYCLOAK_REALM,
  clientId: process.env.KEYCLOAK_CLIENT_ID,
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

  // Connect to AMQP using the access token
  connect(keycloak.token);

  // Logout handler
  $("#navLogout").on("click", () => {
    keycloak.logout();
    $("#navLogout").text("Logout").hide();
    $("#navLogin").show();
  });
}