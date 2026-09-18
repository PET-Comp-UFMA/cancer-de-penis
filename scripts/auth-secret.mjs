import { randomBytes } from 'node:crypto';

// Execute pessoalmente: o segredo não deve ser enviado ao chat ou aos logs.
process.stdout.write(`AUTH_SECRET=${randomBytes(32).toString('hex')}\n`);
