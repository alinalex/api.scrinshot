exports.cronHourAndMinute = () => {
  const date = new Date();

  let hour = date.getHours();
  hour = (hour < 10 ? '0' : '') + hour;

  let min = date.getMinutes() + 2;
  min = (min < 10 ? '0' : '') + min;

  const minAndHour = min + ' ' + hour;

  return minAndHour;
};
