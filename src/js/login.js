import * as bootstrap from "bootstrap";
import $ from "jquery";
import Keycloak from "keycloak-js";
import { connect, updateAmqpToken, setUserExchange } from "./main";

let keycloak; // Make keycloak accessible in all functions

function startTokenRefresh() {
  setInterval(() => {
    keycloak.updateToken(60).then((refreshed) => {
      if (refreshed) {
        updateAmqpToken(keycloak.token);
        console.log("Access token refreshed.");
      }
    }).catch(() => {
      console.error("Failed to refresh token");
    });
  }, 3 * 60 * 1000); // Refresh every 3 minutes
}

function startApplication() {
  $("#navLogin").hide();
  $("#navLogout")
    .text("Logout " + keycloak.tokenParsed.preferred_username)
    .show();

  if (keycloak.token) {
    connect(keycloak.token);
    startTokenRefresh();
  } else {
    console.error("No Keycloak token available.");
  }

  $("#navLogout").on("click", () => {
    keycloak.logout();
    $("#navLogout").text("Logout").hide();
    $("#navLogin").show();
  });
}

// Set Keycloak fields (do NOT pre-fill Client ID and Secret)
$("#loginKeycloakHost").val(process.env.DEFAULT_KEYCLOAK_HOST);
$("#loginKeycloakPort").val(process.env.DEFAULT_KEYCLOAK_PORT);
$("#loginKeycloakRealm").val(process.env.DEFAULT_KEYCLOAK_REALM);
$("#loginKeycloakWebLoginClientId").val(process.env.DEFAULT_KEYCLOAK_WEB_LOGIN_CLIENT_ID);
$("#loginExchange").val(process.env.DEFAULT_RABBITMQ_EXCHANGE);
// const KEYCLOAK_CLIENT_ID = process.env.DEFAULT_KEYCLOAK_CLIENT_ID;
// const KEYCLOAK_CLIENT_SECRET = process.env.DEFAULT_KEYCLOAK_CLIENT_SECRET;

const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
loginModal.show();

// // Keycloak configuration for user authentication
// const KEYCLOAK_HOST = process.env.DEFAULT_KEYCLOAK_HOST;
// const KEYCLOAK_PORT = process.env.DEFAULT_KEYCLOAK_PORT;
// const KEYCLOAK_REALM = process.env.DEFAULT_KEYCLOAK_REALM;
// const KEYCLOAK_WEB_LOGIN_CLIENT_ID = process.env.DEFAULT_KEYCLOAK_WEB_LOGIN_CLIENT_ID;
// const KEYCLOAK_CLIENT_ID = process.env.DEFAULT_KEYCLOAK_CLIENT_ID;
// const KEYCLOAK_CLIENT_SECRET = process.env.DEFAULT_KEYCLOAK_CLIENT_SECRET;

$("#loginForm").on("submit", (e) => {
  e.preventDefault();
  const KEYCLOAK_HOST = $("#loginKeycloakHost").val();
  const KEYCLOAK_PORT =  parseInt($("#loginKeycloakPort").val());
  const KEYCLOAK_REALM = $("#loginKeycloakRealm").val();
  const KEYCLOAK_WEB_LOGIN_CLIENT_ID = $("#loginKeycloakWebLoginClientId").val();
  const KEYCLOAK_CLIENT_ID = $("#loginKeycloakClientId").val() || process.env.DEFAULT_KEYCLOAK_CLIENT_ID;
  const KEYCLOAK_CLIENT_SECRET = $("#loginKeycloakClientSecret").val() || process.env.DEFAULT_KEYCLOAK_CLIENT_SECRET;
  console.log(KEYCLOAK_CLIENT_ID);

  keycloak = new Keycloak({
    url: `https://${KEYCLOAK_HOST}:${KEYCLOAK_PORT}/`,
    realm: KEYCLOAK_REALM,
    clientId: KEYCLOAK_WEB_LOGIN_CLIENT_ID,
  });

  keycloak
    .init({ onLoad: "login-required" })
    .then(function (authenticated) {
      if (authenticated) {
        console.log("User authenticated");
        startApplication();
      } else {
        console.error("User not authenticated");
      }
    })
    .catch(function (err) {
      console.error("Failed to initialize Keycloak", err);
    });
});