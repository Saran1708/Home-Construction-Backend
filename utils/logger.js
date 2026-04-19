const ts = () => new Date().toLocaleString("en-IN");

export const logger = {
  info:  (...args) => console.log(`[${ts()}] [INFO]`,  ...args),
  warn:  (...args) => console.warn(`[${ts()}] [WARN]`,  ...args),
  error: (...args) => console.error(`[${ts()}] [ERROR]`, ...args),
  debug: (...args) => console.log(`[${ts()}] [DEBUG]`, ...args),
  http:  (...args) => console.log(`[${ts()}] [HTTP]`,  ...args),
};