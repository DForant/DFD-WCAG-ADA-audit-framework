import express from 'express';
import auditRouter from './routes/audit.js';

const app = express();

app.use(express.json());

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  next(err);
});

app.use('/api/audit', auditRouter);

export function startServer(port = 3000) {
  const server = app.listen(port, () => {
    console.log(`[server] Audit API running on port ${port}`);
  });
  return server;
}

if (process.argv[1] && process.argv[1].endsWith('server/index.js')) {
  startServer(process.env.PORT || 3000);
}

export default app;
