import { TempusDominus } from '@eonasdan/tempus-dominus'; 
import { convertDateTimeToUTC } from '../utils'

const stopTime = new TempusDominus(document.getElementById('stopTime'), {
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

$("#stopForm").on("submit", (e) => {
    e.preventDefault();
    // TODO: send stop command
    console.log({
      "tasking_parameters": {
        "sim_stop_time": convertDateTimeToUTC(stopTime.dates.lastPicked).toISOString(),
      }
    });
});

export { stopTime };