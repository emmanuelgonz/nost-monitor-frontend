function convertDateTimeToUTC(datetime) {
  return new Date(
    Date.UTC(
      datetime.year,
      datetime.month,
      datetime.date,
      datetime.hours,
      datetime.minutes,
      datetime.seconds,
      datetime.getMilliseconds(),
    ),
  );
}

export { convertDateTimeToUTC };
