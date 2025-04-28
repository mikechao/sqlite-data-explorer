import type { Database } from 'sqlite';
import type sqlite3 from 'sqlite3';
import { z } from 'zod';
import { BaseTool } from './BaseTool';

const readQueryInputSchema = z.object({
  query: z.string().describe('The query to be executed on the SQLite database.'),
});

export class ExecuteQueryTool extends BaseTool<typeof readQueryInputSchema, any> {
  public readonly name = 'execute_query';
  public readonly description = 'Execute a query on the SQLite database.';
  public readonly inputSchema = readQueryInputSchema;

  constructor(private db: Database<sqlite3.Database, sqlite3.Statement>) {
    super();
  }

  public async executeCore(input: z.infer<typeof readQueryInputSchema>) {
    const { query } = input;
    const rows = await this.db.all(query);
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(rows, null, 2),
        },
      ],
    };
  }
}
