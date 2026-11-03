// Plain line output. No colors when NO_COLOR is set or the stream is not a TTY.
const useColor = () => !process.env.NO_COLOR && process.stdout.isTTY;
const paint = (code, text) => (useColor() ? `\u001b[${code}m${text}\u001b[0m` : text);

export const log = {
  line: (text = '') => console.log(text),
  added: (path) => console.log(`${paint(32, 'added  ')} ${path}`),
  updated: (path, note = '') => console.log(`${paint(36, 'updated')} ${path}${note}`),
  skip: (path, why) => console.log(`${paint(33, 'skip   ')} ${path} (${why})`),
  same: (path) => console.log(`${paint(2, 'same   ')} ${path}`),
  would: (verb, path) => console.log(`${paint(2, 'would ' + verb)} ${path}`),
  info: (text) => console.log(text),
  warn: (text) => console.warn(`${paint(33, 'warning:')} ${text}`),
  error: (text) => console.error(`${paint(31, 'error:')} ${text}`),
};
