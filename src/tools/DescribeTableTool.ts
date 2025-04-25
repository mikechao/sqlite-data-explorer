import type { Database } from 'sqlite';
import type sqlite3 from 'sqlite3';
import {z} from 'zod';
import {BaseTool} from './BaseTool';

const describeTableInputSchema = z.object({
  tableName: z.string().describe('The name of the table to describe.')
});

export class DescribeTableTool extends BaseTool<typeof describeTableInputSchema, any> {
  public readonly name = 'describe_table';
  public readonly description = 'Describe a table in the database.';
  public readonly inputSchema = describeTableInputSchema;

  constructor(private db: Database<sqlite3.Database, sqlite3.Statement>) {
    super();
  }

  public async executeCore(input: z.infer<typeof describeTableInputSchema>) {
    const { tableName } = input;
    const columns = await this.db.all(`PRAGMA table_info(${tableName})`);
    const columnDescriptions = columns.map((column) => {
      return `${column.name} (${column.type})${column.notnull ? ' NOT NULL' : ''}${column.dflt_value ? ` DEFAULT ${column.dflt_value}` : ''}`;
    }).join('\n');
    const text = `The table "${tableName}" has the following columns:\n${columnDescriptions}`;
    return {
      content: [
        {
          type: 'text' as const,
          text: text,
        }
      ]
    };
  }  
}