import * as bootstrap from "bootstrap";
import $ from "jquery";
import Keycloak from "keycloak-js";
import { connect, updateAmqpToken } from "./main";

let keycloak = null;
let runtimeConfig = {};

function startApplication(useKeycloak) {
  $("#navLogin").hide();
  if (useKeycloak && keycloak && keycloak.tokenParsed) {
    $("#navLogout")
      .text("Logout " + keycloak.tokenParsed.preferred_username)
      .show();
  } else {
    $("#navLogout").text("Logout").show();
  }

  if (useKeycloak) {
    connect(keycloak.token, runtimeConfig.RabbitMQHost, runtimeConfig.RabbitMQPort, runtimeConfig.RabbitMQExchange)
      .then(() => {
        keycloak.onTokenExpired = () => {
          keycloak.updateToken(30).then((refreshed) => {
            if (refreshed) {
              updateAmqpToken(keycloak.token);
            }
          }).catch((err) => {
            console.error("Failed to refresh Keycloak token:", err);
          });
        };
      })
      .catch((err) => {
        console.error("Could not connect to broker:", err);
      });
  } else {
    // No Keycloak: connect directly to RabbitMQ
    connect(null, runtimeConfig.RabbitMQHost, runtimeConfig.RabbitMQPort, runtimeConfig.RabbitMQExchange);
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

  document.getElementById('loginModal').addEventListener('hidden.bs.modal', function () {
    document.activeElement.blur();
  });

  $('#loginForm').off('submit').on('submit', function (e) {
    e.preventDefault();
    loginModal.hide();

    runtimeConfig.RabbitMQExchange = $('#loginRabbitMQExchange').val();

    if (keycloak && keycloak.authenticated) {
      startApplication(true);
      return;
    }

    const encrypted = $('#loginEncrypted').is(':checked');
    const useKeycloak = $('#useKeycloak').is(':checked');
    const KeycloakHost = $('#loginKeycloakHost').val();
    const KeycloakPort = $('#loginKeycloakPort').val();
    const KeycloakRealm = $('#loginKeycloakRealm').val();
    const KeycloakWebLoginClientId = $('#loginKeycloakWebLoginClientId').val();
    const RabbitMQHost = $('#loginRabbitMQHost').val();
    const RabbitMQPort = $('#loginRabbitMQPort').val();

    runtimeConfig = {
      KeycloakHost,
      KeycloakPort,
      KeycloakRealm,
      KeycloakWebLoginClientId,
      encrypted,
      RabbitMQExchange: runtimeConfig.RabbitMQExchange,
      RabbitMQHost,
      RabbitMQPort
    };

    if (useKeycloak) {
      const protocol = runtimeConfig.encrypted ? 'https' : 'http';
      keycloak = new Keycloak({
        url: `${protocol}://${runtimeConfig.KeycloakHost}:${runtimeConfig.KeycloakPort}/`,
        realm: runtimeConfig.KeycloakRealm,
        clientId: runtimeConfig.KeycloakWebLoginClientId,
      });

      keycloak
        .init({ onLoad: "login-required" })
        .then(function (authenticated) {
          if (authenticated) {
            startApplication(true);
          } else {
            console.error("User not authenticated.");
          }
        })
        .catch(function (error) {
          console.error("Keycloak initialization failed:", error);
        });
    } else {
      startApplication(false);
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
        startApplication(true);
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
  //RabbitMQ
  $('#loginRabbitMQExchange').val(DEFAULT_RABBITMQ_EXCHANGE);
  $('#loginRabbitMQHost').val(DEFAULT_RABBITMQ_HOST);
  $('#loginRabbitMQPort').val(DEFAULT_RABBITMQ_RELAY_PORT);

  // Keycloak section toggle (within advanced settings)
  $('#useKeycloak').on('change', function () {
    $('#keycloakSection').toggle(this.checked);
  });
  $('#keycloakSection').toggle($('#useKeycloak').is(':checked'));

  // Advanced settings toggle (dev builds only)
  if (process.env.NODE_ENV !== "production") {
    $('#advancedToggle').show();
    $('#advancedToggleLink').on('click', function (e) {
      e.preventDefault();
      var isHidden = $('#advancedSettings').is(':hidden');
      $('#advancedSettings').toggle();
      $('#advancedToggleIcon').attr('class', isHidden ? 'bi bi-chevron-down' : 'bi bi-chevron-right');
    });
  }

  if (process.env.NODE_ENV === "production") {
    runtimeConfig = {
      KeycloakHost: DEFAULT_KEYCLOAK_HOST,
      KeycloakPort: DEFAULT_KEYCLOAK_PORT,
      KeycloakRealm: DEFAULT_KEYCLOAK_REALM,
      KeycloakWebLoginClientId: DEFAULT_KEYCLOAK_WEB_LOGIN_CLIENT_ID,
      encrypted: true,
      RabbitMQHost: DEFAULT_RABBITMQ_HOST,
      RabbitMQPort: DEFAULT_RABBITMQ_RELAY_PORT,
      RabbitMQExchange: sessionStorage.getItem('rabbitmqExchange') || DEFAULT_RABBITMQ_EXCHANGE,
    };

    keycloak = new Keycloak({
      url: `https://${runtimeConfig.KeycloakHost}:${runtimeConfig.KeycloakPort}/`,
      realm: runtimeConfig.KeycloakRealm,
      clientId: runtimeConfig.KeycloakWebLoginClientId,
    });

    keycloak.init({ onLoad: "login-required" })
      .then(function (authenticated) {
        if (authenticated) {
          $('#loginRabbitMQExchange').val(runtimeConfig.RabbitMQExchange);
          showLoginModal();
        }
      })
      .catch(function (error) {
        console.error("Keycloak initialization failed:", error);
      });
  } else {
    checkExistingAuthentication();
  }

  $(document).on('submit', '#loginForm', function() {
    if (runtimeConfig && Object.keys(runtimeConfig).length > 0) {
      sessionStorage.setItem('runtimeConfig', JSON.stringify(runtimeConfig));
    }
    if (runtimeConfig.RabbitMQExchange) {
      sessionStorage.setItem('rabbitmqExchange', runtimeConfig.RabbitMQExchange);
    }
  });
});