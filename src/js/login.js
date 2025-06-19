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

function startApplication(loginModal) {
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
    // Clear stored configuration on logout
    localStorage.removeItem('keycloakConfig');
    $("#navLogout").text("Logout").hide();
    $("#navLogin").show();
  });
}

// Set default values from environment variables
const DEFAULT_RABBITMQ_EXCHANGE = process.env.DEFAULT_RABBITMQ_EXCHANGE || '';
const DEFAULT_KEYCLOAK_HOST = process.env.DEFAULT_KEYCLOAK_HOST || '';
const DEFAULT_KEYCLOAK_PORT = process.env.DEFAULT_KEYCLOAK_PORT || '';
const DEFAULT_KEYCLOAK_REALM = process.env.DEFAULT_KEYCLOAK_REALM || '';
const DEFAULT_KEYCLOAK_WEB_LOGIN_CLIENT_ID = process.env.DEFAULT_KEYCLOAK_WEB_LOGIN_CLIENT_ID || '';
const DEFAULT_KEYCLOAK_CLIENT_ID = process.env.DEFAULT_KEYCLOAK_CLIENT_ID || '';
const DEFAULT_KEYCLOAK_CLIENT_SECRET = process.env.DEFAULT_KEYCLOAK_CLIENT_SECRET || '';

// Check authentication state on page load
$(document).ready(function () {
  // Set default values in modal fields
  $('#loginExchange').val(DEFAULT_RABBITMQ_EXCHANGE);
  $('#loginKeycloakHost').val(DEFAULT_KEYCLOAK_HOST);
  $('#loginKeycloakPort').val(DEFAULT_KEYCLOAK_PORT);
  $('#loginKeycloakRealm').val(DEFAULT_KEYCLOAK_REALM);
  $('#loginKeycloakWebLoginClientId').val(DEFAULT_KEYCLOAK_WEB_LOGIN_CLIENT_ID);
  $('#loginKeycloakClientId').val();
  $('#loginKeycloakClientSecret').val();
  
  const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
  
  // Check if we have stored authentication data and try to restore session
  const storedConfig = localStorage.getItem('keycloakConfig');
  if (storedConfig) {
    try {
      keycloakConfig = JSON.parse(storedConfig);
      
      // Set user exchange if needed
      if (setUserExchange && keycloakConfig.exchange) {
        setUserExchange(keycloakConfig.exchange);
      }
      
      // Use https if encrypted, http otherwise
      const protocol = keycloakConfig.encrypted ? 'https' : 'http';
      
      keycloak = new Keycloak({
        url: `${protocol}://${keycloakConfig.host}:${keycloakConfig.port}/`,
        realm: keycloakConfig.realm,
        clientId: keycloakConfig.webLoginClientId,
      });
      
      // Try to restore session without forcing login
      keycloak
        .init({ onLoad: "check-sso", silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html" })
        .then(function (authenticated) {
          if (authenticated) {
            console.log("User session restored.");
            startApplication(loginModal);
          } else {
            console.log("No existing session found, showing login modal.");
            loginModal.show();
          }
        })
        .catch(function (error) {
          console.log("Error checking SSO session, showing login modal.", error);
          loginModal.show();
        });
    } catch (error) {
      console.log("Error parsing stored config, showing login modal.", error);
      loginModal.show();
    }
  } else {
    // No stored config, show login modal
    loginModal.show();
  }

  // Handle login button click to show modal
  $("#navLogin").on("click", function() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
  });

  $('#loginForm').on('submit', function (e) {
    e.preventDefault();
    loginModal.hide(); // Hide the modal immediately on submit
    const $connectBtn = $('#loginConnect');
    $connectBtn.prop('disabled', true); // Disable button to prevent double click
    // Get values from modal fields
    const exchange = $('#loginExchange').val();
    const host = $('#loginKeycloakHost').val();
    const port = $('#loginKeycloakPort').val();
    const realm = $('#loginKeycloakRealm').val();
    const clientId = $('#loginKeycloakClientId').val() || DEFAULT_KEYCLOAK_CLIENT_ID;
    const clientSecret = $('#loginKeycloakClientSecret').val() || DEFAULT_KEYCLOAK_CLIENT_SECRET;
    const webLoginClientId = $('#loginKeycloakWebLoginClientId').val();
    const encrypted = $('#loginEncrypted').is(':checked');

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
          // Store configuration in localStorage for session restoration
          localStorage.setItem('keycloakConfig', JSON.stringify(keycloakConfig));
          startApplication(loginModal); // Pass modal to startApplication
        } else {
          console.error("User not authenticated.");
          loginModal.show(); // Show modal again on failure
          $connectBtn.prop('disabled', false); // Re-enable on failure
        }
      })
      .catch(function (error) {
        console.error("Authentication error:", error);
        loginModal.show(); // Show modal again on error
        $connectBtn.prop('disabled', false); // Re-enable on error
      });
  });
});