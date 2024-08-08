import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import $ from 'jquery';

hljs.registerLanguage('json', json);

let examplePayload = JSON.stringify(
    {
    "tasking_parameters": {
      "required_apps": [],
      "sim_start_time": "2024-08-01T22:07:47.227Z",
      "sim_stop_time": "2024-08-07T22:07:47.227Z"
    }
  },
  null,
  2
);

let formattedPayload = hljs.highlight(examplePayload, {language: 'json'}).value.replace(/  /g, "&nbsp;").replace(/\n/g, "<br />");
console.log(formattedPayload);
$("#logsPanel .logs-payload").html(formattedPayload);