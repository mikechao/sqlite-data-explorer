import type { Database } from 'sqlite';
import type sqlite3 from 'sqlite3';
import { z } from 'zod';
import { BaseTool } from './BaseTool';

const readQueryInputSchema = z.object({
  query: z.string().describe('Execute a SELECT query on the SQLite database.')
});

export class ReadQueryTool extends BaseTool<typeof readQueryInputSchema, any> {
  public readonly name = 'read_query';
  public readonly description = 'Execute a SELECT query on the SQLite database.';
  public readonly inputSchema = readQueryInputSchema;

  constructor(private db: Database<sqlite3.Database, sqlite3.Statement>) {
    super();
  }

  public async executeCore(input: z.infer<typeof readQueryInputSchema>) {
    const { query } = input;
    if (!query.trim().toLowerCase().startsWith('select')) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Only SELECT queries are allowed.',
            isError: true,
          }
        ]
      };
    }
    const rows = await this.db.all(query);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(rows, null, 2),
        }
      ]
    };
  }  
}