//current date
const today = new Date();

// thrity one days ago
const thirtyOneDaysAgo = new Date();
thirtyOneDaysAgo.setDate(today.getDate() - 31);

// ninety days ago
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(today.getDate() - 90);

const mmddyyyy = (d) => {
  const date = new Date(d || Date.now());
  let month = date.getMonth() + 1;
  if (month < 10) month = `0${month}`;
  let day = date.getDate();
  if (day < 10) day = `0${day}`;
  const year = date.getFullYear();
  return `${month}${day}${year}`;
};

const usDateFormat = (date) => {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

module.exports = { mmddyyyy, ninetyDaysAgo, today, thirtyOneDaysAgo, usDateFormat };
