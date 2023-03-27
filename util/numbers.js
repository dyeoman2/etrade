// round value to 2 decimal places
const round = (value) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

// format value as percentage
const formatPercentage = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
  }).format(value);
};

// format value as currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

// export functions
module.exports = {
  formatCurrency,
  formatPercentage,
  round,
};
