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
        updateAmqpToken(newToken);
        console.log("Access token refreshed.");
      }
    });
  }, 3 * 60 * 1000);
}

function startApplication() {
  $("#navLogin").hide();
  $("#navLogout")
    .text("Logout " + keycloak.tokenParsed.preferred_username)
    .show();

  // Prompt for exchange name after login
  if (exchange) {
    // Set the global variable
    import("./main").then(mod => {
      mod.userExchange = exchange;
      fetchAccessToken().then(token => {
        if (token) {
          mod.connect(token);
          startTokenRefresh();
        } else {
          console.error("Could not fetch AMQP access token.");
        }
      });
    });
  } else {
    fetchAccessToken().then(token => {
      if (token) {
        connect(token);
        startTokenRefresh();
      } else {
        console.error("Could not fetch AMQP access token.");
      }
    });
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

const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
loginModal.show();

$("#loginForm").on("submit", function (e) {
  e.preventDefault();
  const KEYCLOAK_HOST = $("#loginKeycloakHost").val();
  const KEYCLOAK_PORT = parseInt($("#loginKeycloakPort").val());
  const KEYCLOAK_REALM = $("#loginKeycloakRealm").val();
  const KEYCLOAK_WEB_LOGIN_CLIENT_ID = $("#loginKeycloakWebLoginClientId").val();
  const exchange = $("#loginExchange").val();
  
  if (exchange) {
    setUserExchange(exchange);
  }
  
  console.log({
    KEYCLOAK_HOST,
    KEYCLOAK_PORT,
    KEYCLOAK_REALM,
    KEYCLOAK_WEB_LOGIN_CLIENT_ID,
    exchange,
  });

  const keycloak = new Keycloak({
    url: `https://${KEYCLOAK_HOST}:${KEYCLOAK_PORT}/`,
    realm: KEYCLOAK_REALM,
    clientId: KEYCLOAK_WEB_LOGIN_CLIENT_ID,
  });

  keycloak
    .init({ onLoad: "login-required" })
    .then(function (authenticated) {
      if (authenticated) {
        loginModal.hide()
        startApplication();
      } else {
        console.error("User not authenticated");
      }
    })
    .catch(function () {
      console.error("Failed to initialize Keycloak");
    });

});