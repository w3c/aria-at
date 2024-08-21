const colors = {
  reset: '\x1b[0m',
  red: '\x1b[91m',
  green: '\x1b[92m',
  yellow: '\x1b[93m',
};

const text = (text, { color = '', severity = 'log', performReset = true }) => {
  console[severity](`${color}${text}${performReset ? colors.reset : ''}`);
};

module.exports = {
  consoleColors: colors,
  consoleText: text,
};
