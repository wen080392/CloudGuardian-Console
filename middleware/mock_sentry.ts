// Mocked Sentry for local bypass
let Sentry: any;

try {
  Sentry = require('@sentry/node');
} catch (e) {
  Sentry = {
    init: (config: any) => console.log('Mock Sentry initialized:', config.dsn),
    Handlers: {
      requestHandler: () => (req: any, res: any, next: any) => next(),
      tracingHandler: () => (req: any, res: any, next: any) => next(),
      errorHandler: () => (err: any, req: any, res: any, next: any) => next(err),
    }
  };
}

export default Sentry;
