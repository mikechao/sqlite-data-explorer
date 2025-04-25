import type { Database } from 'sqlite';
import type sqlite3 from 'sqlite3';
import { z } from 'zod';
import { BaseTool } from './BaseTool';

const listTablesInputSchema = z.object({});

export class ListTablesTool extends BaseTool<typeof listTablesInputSchema, any> {
  public readonly name = 'list_tables';
  public readonly description = 'List all tables in the database.';
  public readonly inputSchema = listTablesInputSchema;

  constructor(private db: Database<sqlite3.Database, sqlite3.Statement>) {
    super();
  }

  public async executeCore() {
    const tables = await this.db.all('SELECT name FROM sqlite_master WHERE type="table"');
    return {
      content: tables.map(table => ({
        type: 'text' as const,
        text: table.name,
      })),
      isError: false,
    };
  }
}
