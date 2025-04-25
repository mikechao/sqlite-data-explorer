#!/usr/bin/env node

import process from 'node:process';
import { parseArgs } from 'node:util';
import { SqliteMcpServer } from './server.js';

const args = parseArgs({
  options: {
    'db-path': {
      type: 'string',
      required: true,
    },
  },
});

if (!args.values['db-path']) {
  console.error('Error: --db-path argument is required.');
  process.exit(1);
}

const dbPath = args.values['db-path'] as string;
const server = new SqliteMcpServer(dbPath);

start()
  .then(() => {
    console.error('Server started successfully');
  });

async function start() {
  try {
    await server.ready;
    await server.start();
  }
  catch (error) {
    console.error(`Error starting server: ${error}`);
    process.exit(1);
  }
}
