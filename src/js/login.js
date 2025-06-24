import * as bootstrap from "bootstrap";
import $ from "jquery";
import Keycloak from "keycloak-js";
import { connect, updateAmqpToken } from "./main";

let keycloak = null;
let runtimeConfig = {};

function fetchAccessToken() {
  return fetch(`https://${runtimeConfig.KeycloakHost}:${runtimeConfig.KeycloakPort}/realms/${runtimeConfig.KeycloakRealm}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      'client_id': runtimeConfig.KeycloakClientId,
      'client_secret': runtimeConfig.KeycloakClientSecret,
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
        // console.log("Access token refreshed.");
      }
    });
  }, 3 * 60 * 1000); // Refresh every 3 minutes
}

function startApplication(token, useKeycloak) {
  $("#navLogin").hide();
  if (useKeycloak && keycloak && keycloak.tokenParsed) {
    $("#navLogout")
      .text("Logout " + keycloak.tokenParsed.preferred_username)
      .show();
  } else {
    $("#navLogout").text("Logout").show();
  }

  if (useKeycloak) {
    fetchAccessToken().then(async token => {
      if (token) {
        try {
          await connect(token, RabbitMQHost, RabbitMQPort, RabbitMQExchange);
          startTokenRefresh();
        } catch (err) {
          console.error("Could not connect to broker:", err);
        }
      } else {
        console.error("Could not fetch AMQP access token.");
      }
    });
  } else {
    // No Keycloak: connect directly to RabbitMQ
    connect(null); // Or pass any required params for direct connection
  }

  $("#navLogout").on("click", () => {
    if (useKeycloak && keycloak) {
      keycloak.logout();
    }
    $("#navLogout").text("Logout").hide();
  });
}

function showLoginModal() {
  const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
  loginModal.show();

  $('#loginForm').off('submit').on('submit', function (e) {
    e.preventDefault();
    loginModal.hide(); // Hide the modal immediately on submit
    const $connectBtn = $('#loginConnect');
    $connectBtn.prop('disabled', true); // Disable button to prevent double click
    
    // Get values from modal fields
    // General
    const encrypted = $('#loginEncrypted').is(':checked');
    const useKeycloak = $('#useKeycloak').is(':checked');
    // Keycloak
    const KeycloakHost = $('#loginKeycloakHost').val();
    const KeycloakPort = $('#loginKeycloakPort').val();
    const KeycloakRealm = $('#loginKeycloakRealm').val();
    const KeycloakWebLoginClientId = $('#loginKeycloakWebLoginClientId').val();
    const KeycloakClientId = $('#loginKeycloakClientId').val() || DEFAULT_KEYCLOAK_CLIENT_ID;
    const KeycloakClientSecret = $('#loginKeycloakClientSecret').val() || DEFAULT_KEYCLOAK_CLIENT_SECRET;
    // RabbitMQ
    const RabbitMQExchange = $('#loginRabbitMQExchange').val() || DEFAULT_RABBITMQ_EXCHANGE;
    const RabbitMQHost = $('#loginRabbitMQHost').val() || DEFAULT_RABBITMQ_HOST;
    const RabbitMQPort = $('#loginRabbitMQPort').val() || DEFAULT_RABBITMQ_RELAY_PORT;

    runtimeConfig = {
      KeycloakHost,
      KeycloakPort,
      KeycloakRealm,
      KeycloakClientId,
      KeycloakClientSecret,
      KeycloakWebLoginClientId,
      encrypted,
      RabbitMQExchange
    };
    
    if (useKeycloak) {
      // Use https if encrypted, http otherwise
      const protocol = encrypted ? 'https' : 'http';
      keycloak = new Keycloak({
        url: `${protocol}://${KeycloakHost}:${KeycloakPort}/`,
        realm: KeycloakRealm,
        clientId: KeycloakWebLoginClientId,
      });

      keycloak
        .init({ onLoad: "login-required" })
        .then(function (authenticated) {
          if (authenticated) {
            console.log("User authenticated.");
            startApplication(null, true); // Token will be fetched inside
          } else {
            console.error("User not authenticated.");
            $connectBtn.prop('disabled', false); // Re-enable on failure
          }
        })
        .catch(function (error) {
          console.error("Keycloak initialization failed:", error);
          $connectBtn.prop('disabled', false); // Re-enable on error
        });
    } else {
      // No Keycloak: connect directly
      startApplication(null, false);
    }
  });
}

function checkExistingAuthentication() {
  // Check if we have stored keycloak config from previous session
  const storedConfig = sessionStorage.getItem('runtimeConfig');
  if (storedConfig) {
    try {
      runtimeConfig = JSON.parse(storedConfig);
      const protocol = runtimeConfig.encrypted ? 'https' : 'http';
      keycloak = new Keycloak({
        url: `${protocol}://${runtimeConfig.KeycloakHost}:${runtimeConfig.KeycloakPort}/`,
        realm: runtimeConfig.KeycloakRealm,
        clientId: runtimeConfig.KeycloakWebLoginClientId,
      });

      // Set up the authentication success event handler
      keycloak.onAuthSuccess = function() {
        console.log('Authenticated!');
        startApplication(null, true);
      };

      keycloak
        .init({ onLoad: "check-sso" })
        .then(function (authenticated) {
          if (authenticated) {
            console.log("User already authenticated, starting application.");
          } else {
            console.log("User not authenticated, showing login modal.");
            showLoginModal();
          }
        })
        .catch(function (error) {
          console.error("Keycloak check failed:", error);
          showLoginModal();
        });
    } catch (error) {
      console.error("Failed to parse stored config:", error);
      showLoginModal();
    }
  } else {
    // No stored config, show login modal
    showLoginModal();
  }
}

// Set default values from environment variables
// Keycloak
const DEFAULT_KEYCLOAK_HOST = process.env.DEFAULT_KEYCLOAK_HOST || '';
const DEFAULT_KEYCLOAK_PORT = process.env.DEFAULT_KEYCLOAK_PORT || '';
const DEFAULT_KEYCLOAK_REALM = process.env.DEFAULT_KEYCLOAK_REALM || '';
const DEFAULT_KEYCLOAK_WEB_LOGIN_CLIENT_ID = process.env.DEFAULT_KEYCLOAK_WEB_LOGIN_CLIENT_ID || '';
const DEFAULT_KEYCLOAK_CLIENT_ID = process.env.DEFAULT_KEYCLOAK_CLIENT_ID || '';
const DEFAULT_KEYCLOAK_CLIENT_SECRET = process.env.DEFAULT_KEYCLOAK_CLIENT_SECRET || '';
// RabbitMQ
const DEFAULT_RABBITMQ_EXCHANGE = process.env.DEFAULT_RABBITMQ_EXCHANGE || '';
const DEFAULT_RABBITMQ_HOST = process.env.DEFAULT_RABBITMQ_HOST || '';
const DEFAULT_RABBITMQ_RELAY_PORT = process.env.DEFAULT_RABBITMQ_RELAY_PORT || '';

// Initialize application on page load
$(document).ready(function () {
  // Set default values in modal fields
  // Keycloak
  $('#loginKeycloakHost').val(DEFAULT_KEYCLOAK_HOST);
  $('#loginKeycloakPort').val(DEFAULT_KEYCLOAK_PORT);
  $('#loginKeycloakRealm').val(DEFAULT_KEYCLOAK_REALM);
  $('#loginKeycloakWebLoginClientId').val(DEFAULT_KEYCLOAK_WEB_LOGIN_CLIENT_ID);
  $('#loginKeycloakClientId').val();
  $('#loginKeycloakClientSecret').val();
  //RabbitMQ
  $('#loginRabbitMQExchange').val(DEFAULT_RABBITMQ_EXCHANGE);
  $('#loginRabbitMQHost').val(DEFAULT_RABBITMQ_HOST);
  $('#loginRabbitMQPort').val(DEFAULT_RABBITMQ_RELAY_PORT);

  // Check for existing authentication first
  checkExistingAuthentication();

  // Store config in session storage when form is submitted
  $(document).on('submit', '#loginForm', function() {
    if (runtimeConfig && Object.keys(runtimeConfig).length > 0) {
      sessionStorage.setItem('runtimeConfig', JSON.stringify(runtimeConfig));
    }
  });
});