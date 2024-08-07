import * as bootstrap from 'bootstrap'

import { connect } from "./main"

// load environment variables
$("#loginPrefix").val(process.env.DEFAULT_PREFIX);
$("#loginUsername").val(process.env.DEFAULT_USERNAME);
$("#loginPassword").val(process.env.DEFAULT_PASSWORD);
$("#loginHostname").val(process.env.DEFAULT_HOSTNAME);
$("#loginPort").val(process.env.DEFAULT_PORT);

const loginModal = new bootstrap.Modal(document.getElementById("loginModal"))
loginModal.show();

$("#loginForm").on("submit", (e) => {
  e.preventDefault();
  // TODO: authenticate credentials
  const username = $("#loginUsername").val();
  const password = $("#loginPassword").val();
  const hostname = $("#loginHostname").val();
  const port = parseInt($("#loginPort").val());
  const encrypted = $("#loginEncrypted").prop("checked");
  const connectionString = "mqtt" + (encrypted ? "s" : "") + "://" + hostname + ":" + port;
  connect(connectionString, username, password, (err) => {
    if(!err) {
      $("#navLogin").hide();
      $("#navLogout").text("Logout " + $("#loginUsername").val() + " (" + $("#loginPrefix").val() + ")");
      $("#navLogout").show();
    } else {
      console.log(err);
    }
    loginModal.hide();
  });
});

$("#navLogout").on("click", (e) => {
  $("#navLogout").text("Logout");
  $("#navLogout").hide();
  $("#navLogin").show();
});