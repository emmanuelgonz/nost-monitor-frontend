import { TempusDominus } from '@eonasdan/tempus-dominus'; 
import { convertDateTimeToUTC } from '../utils'

const initializePicker = new TempusDominus(document.getElementById('initializeStartEnd'), {
  dateRange: true,
  multipleDatesSeparator: " - ",
  display: {
    icons: {
      time: 'bi bi-clock',
      date: 'bi bi-calendar',
      up: 'bi bi-arrow-up',
      down: 'bi bi-arrow-down',
      previous: 'bi bi-chevron-left',
      next: 'bi bi-chevron-right',
      today: 'bi bi-calendar-check',
      clear: 'bi bi-trash',
      close: 'bi bi-x',
    },
    sideBySide: true,
    buttons: {
      close: true,
    },
  }
});

$("#initializeForm").on("submit", (e) => {
    e.preventDefault();
    // TODO: send initialize command
    console.log({
      "tasking_parameters": {
        "required_apps": $("#initializeRequiredApps").val().split(",").map(s => s.trim()),
        "sim_start_time": convertDateTimeToUTC(initializePicker.dates.picked[0]).toISOString(),
        "sim_stop_time": convertDateTimeToUTC(initializePicker.dates.picked[1]).toISOString(),
      }
    });
});