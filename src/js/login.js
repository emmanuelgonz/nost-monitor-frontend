import * as bootstrap from "bootstrap";
import $ from "jquery";
import Keycloak from "keycloak-js";
import { connect, updateAmqpToken, setUserExchange } from "./main";

// // Keycloak configuration for user authentication
// const KEYCLOAK_HOST = process.env.DEFAULT_KEYCLOAK_HOST;
// const KEYCLOAK_PORT = process.env.DEFAULT_KEYCLOAK_PORT;
// const KEYCLOAK_REALM = process.env.DEFAULT_KEYCLOAK_REALM;
// const KEYCLOAK_WEB_LOGIN_CLIENT_ID = process.env.DEFAULT_KEYCLOAK_WEB_LOGIN_CLIENT_ID;
// const KEYCLOAK_CLIENT_ID = process.env.DEFAULT_KEYCLOAK_CLIENT_ID;
// const KEYCLOAK_CLIENT_SECRET = process.env.DEFAULT_KEYCLOAK_CLIENT_SECRET;

// // Load environment variables into login modal fields
// $("#loginPrefix").val(process.env.DEFAULT_PREFIX);
// $("#loginUsername").val(process.env.DEFAULT_USERNAME);
// $("#loginPassword").val(process.env.DEFAULT_PASSWORD);
// $("#loginHostname").val(process.env.DEFAULT_HOSTNAME);
// $("#loginPort").val(process.env.DEFAULT_PORT);
// $("#loginExchange").val(process.env.DEFAULT_RABBITMQ_EXCHANGE);

// Set Keycloak fields (do NOT pre-fill Client ID and Secret)
$("#loginKeycloakHost").val(process.env.DEFAULT_KEYCLOAK_HOST);
$("#loginKeycloakPort").val(process.env.DEFAULT_KEYCLOAK_PORT);
$("#loginKeycloakRealm").val(process.env.DEFAULT_KEYCLOAK_REALM);
$("#loginKeycloakWebLoginClientId").val(process.env.DEFAULT_KEYCLOAK_WEB_LOGIN_CLIENT_ID);

// Do not pre-fill these:
// $("#loginKeycloakClientId").val(process.env.DEFAULT_KEYCLOAK_CLIENT_ID);
// $("#loginKeycloakClientSecret").val(process.env.DEFAULT_KEYCLOAK_CLIENT_SECRET);

const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
loginModal.show();

$("#loginForm").on("submit", (e) => {
  e.preventDefault();

  const KEYCLOAK_HOST = $("#loginKeycloakHost").val();
  const KEYCLOAK_PORT = $("#loginKeycloakPort").val();
  const KEYCLOAK_REALM = $("#loginKeycloakRealm").val();
  const KEYCLOAK_WEB_LOGIN_CLIENT_ID = $("#loginKeycloakWebLoginClientId").val();

  const keycloak = new Keycloak({
    url: `https://${KEYCLOAK_HOST}:${KEYCLOAK_PORT}/`,
    realm: KEYCLOAK_REALM,
    clientId: KEYCLOAK_WEB_LOGIN_CLIENT_ID,
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

});


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

$("#loginForm").on("submit", function (e) {
  e.preventDefault();
  const exchange = $("#loginExchange").val();
  if (exchange) {
    setUserExchange(exchange);
  }
  // Get Keycloak values from form, fallback to env if blank
  const keycloakClientId = $("#loginKeycloakClientId").val() || process.env.DEFAULT_KEYCLOAK_CLIENT_ID;
  const keycloakClientSecret = $("#loginKeycloakClientSecret").val() || process.env.DEFAULT_KEYCLOAK_CLIENT_SECRET;
  function fetchAccessTokenOverride() {
    return fetch(`https://${KEYCLOAK_HOST}:${KEYCLOAK_PORT}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'client_id': keycloakClientId,
        'client_secret': keycloakClientSecret,
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
  fetchAccessTokenOverride().then(token => {
    if (token) {
      connect(token);
      startTokenRefresh();
      $("#navLogin").hide();
      $("#navLogout").text("Logout " + $("#loginUsername").val() + " (" + $("#loginPrefix").val() + ")").show();
    } else {
      console.error("Could not fetch AMQP access token.");
    }
    loginModal.hide();
  });
});

$("#navLogout").on("click", () => {
  $("#navLogout").text("Logout").hide();
  $("#navLogin").show();
});