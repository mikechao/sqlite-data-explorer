#!/usr/bin/env node

import process from 'node:process';
import { parseArgs } from 'node:util';

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
