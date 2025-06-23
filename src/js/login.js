import * as bootstrap from "bootstrap";
import $ from "jquery";
import Keycloak from "keycloak-js";
import { connect, updateAmqpToken, setUserExchange } from "./main";

let keycloak = null;
let keycloakConfig = {};

function fetchAccessToken() {
  return fetch(`https://${keycloakConfig.host}:${keycloakConfig.port}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'client_id': keycloakConfig.clientId,
      'client_secret': keycloakConfig.clientSecret,
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

  fetchAccessToken().then(async token => {
    if (token) {
      try {
        await connect(token); // Wait for broker connection
        startTokenRefresh();
      } catch (err) {
        console.error("Could not connect to broker:", err);
      }
    } else {
      console.error("Could not fetch AMQP access token.");
    }
  });

  $("#navLogout").on("click", () => {
    keycloak.logout();
    $("#navLogout").text("Logout").hide();
  });
}

// Set default values from environment variables
const exchange = process.env.DEFAULT_RABBITMQ_EXCHANGE || '';
const host = process.env.DEFAULT_KEYCLOAK_HOST || '';
const port = process.env.DEFAULT_KEYCLOAK_PORT || '';
const realm = process.env.DEFAULT_KEYCLOAK_REALM || '';
const webLoginClientId = process.env.DEFAULT_KEYCLOAK_WEB_LOGIN_CLIENT_ID || '';
const clientId = process.env.DEFAULT_KEYCLOAK_CLIENT_ID || '';
const clientSecret = process.env.DEFAULT_KEYCLOAK_CLIENT_SECRET || '';
const encrypted = process.env.DEFAULT_KEYCLOAK_ENCRYPTED === 'true' || true;

// Show login modal on page load
$(document).ready(function () {

  keycloakConfig = {
    host,
    port,
    realm,
    clientId,
    clientSecret,
    webLoginClientId,
    encrypted,
    exchange
  };

  // Set user exchange if needed
  if (setUserExchange) setUserExchange(exchange);

  // Use https if encrypted, http otherwise
  const protocol = encrypted ? 'https' : 'http';

  keycloak = new Keycloak({
    url: `${protocol}://${host}:${port}/`,
    realm: realm,
    clientId: webLoginClientId,
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
      console.error("Failed to initialize Keycloak");
    });
});