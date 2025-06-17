import * as bootstrap from "bootstrap";
import $ from "jquery";
import Keycloak from "keycloak-js";
import { connect, updateAmqpToken, setUserExchange } from "./main";

// Keycloak configuration for user authentication
const KEYCLOAK_HOST = process.env.DEFAULT_KEYCLOAK_HOST;
const KEYCLOAK_PORT = process.env.DEFAULT_KEYCLOAK_PORT;
const KEYCLOAK_REALM = process.env.DEFAULT_KEYCLOAK_REALM;
const KEYCLOAK_WEB_LOGIN_CLIENT_ID = process.env.DEFAULT_KEYCLOAK_WEB_LOGIN_CLIENT_ID;
const KEYCLOAK_CLIENT_ID = process.env.DEFAULT_KEYCLOAK_CLIENT_ID;
const KEYCLOAK_CLIENT_SECRET = process.env.DEFAULT_KEYCLOAK_CLIENT_SECRET;

// Load environment variables into login modal fields
$("#loginPrefix").val(process.env.DEFAULT_PREFIX);
$("#loginUsername").val(process.env.DEFAULT_USERNAME);
$("#loginPassword").val(process.env.DEFAULT_PASSWORD);
$("#loginHostname").val(process.env.DEFAULT_HOSTNAME);
$("#loginPort").val(process.env.DEFAULT_PORT);
$("#loginExchange").val(process.env.DEFAULT_RABBITMQ_EXCHANGE);

const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
loginModal.show();

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
  fetchAccessToken().then(token => {
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