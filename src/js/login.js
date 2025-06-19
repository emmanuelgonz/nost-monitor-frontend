import * as bootstrap from "bootstrap";
import $ from "jquery";
import Keycloak from "keycloak-js";
import { connect, updateAmqpToken, setUserExchange } from "./main";

function fetchAccessToken() {
  return fetch(`https://${KEYCLOAK_HOST}:${KEYCLOAK_PORT}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'client_id': KEYCLOAK_CLIENT_ID,
      'client_secret': KEYCLOAK_CLIENT_SECRET,
      'grant_type': 'client_credentials'
    })
  })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        return response.text().then(text => {
          console.error("Failed to obtain access token:", text);
          throw new Error('Failed to obtain access token');
        });
      }
    })
    .then(data => {
      return data.access_token;
    })
    .catch(error => {
      console.error(error);
    });
}

function startTokenRefresh() {
  setInterval(() => {
    fetchAccessToken().then(newToken => {
      if (newToken) {
        updateAmqpToken(newToken); // Call update in main.js
        console.log("Access token refreshed.");
      }
    });
  }, 3 * 60 * 1000); // Refresh every 3 minutes
}

function startApplication() {
  $("#navLogin").hide();
  $("#navLogout")
    .text("Logout " + keycloak.tokenParsed.preferred_username)
    .show();

  fetchAccessToken().then(token => {
    if (token) {
      connect(token);
      startTokenRefresh();
    } else {
      console.error("Could not fetch AMQP access token.");
    }
  });

  $("#navLogout").on("click", () => {
    keycloak.logout();
    $("#navLogout").text("Logout").hide();
    $("#navLogin").show();
  });
}

// Keycloak configuration for user authentication
const KEYCLOAK_HOST = process.env.DEFAULT_KEYCLOAK_HOST;
const KEYCLOAK_PORT = process.env.DEFAULT_KEYCLOAK_PORT;
const KEYCLOAK_REALM = process.env.DEFAULT_KEYCLOAK_REALM;
const KEYCLOAK_WEB_LOGIN_CLIENT_ID = process.env.DEFAULT_KEYCLOAK_WEB_LOGIN_CLIENT_ID;
const KEYCLOAK_CLIENT_ID = process.env.DEFAULT_KEYCLOAK_CLIENT_ID;
const KEYCLOAK_CLIENT_SECRET = process.env.DEFAULT_KEYCLOAK_CLIENT_SECRET;

const keycloak = new Keycloak({
  url: `https://${KEYCLOAK_HOST}:${KEYCLOAK_PORT}/`,
  realm: KEYCLOAK_REALM,
  clientId: KEYCLOAK_WEB_LOGIN_CLIENT_ID,
});

keycloak
  .init({ onLoad: "login-required" })
  .then(function (authenticated) {
    if (authenticated) {
      console.log("User authenticated.");
      startApplication();
    } else {
      console.error("User not authenticated.");
    }
  })
  .catch(function () {
    console.error("Failed to initialize Keycloak.");
  });