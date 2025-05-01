import type { Database } from 'sqlite';
import type sqlite3 from 'sqlite3';
import { z } from 'zod';
import { BaseTool } from './BaseTool.js';

const indexesForTableInputSchema = z.object({
  tableName: z.string().describe('The name of the table to get indexes for.'),
});

export class IndexesForTableTool extends BaseTool<typeof indexesForTableInputSchema, any> {
  public readonly name = 'indexes_for_table';
  public readonly description = 'Get indexes for a table in the database.';
  public readonly inputSchema = indexesForTableInputSchema;

  constructor(private db: Database<sqlite3.Database, sqlite3.Statement>) {
    super();
  }

  public async executeCore(input: z.infer<typeof indexesForTableInputSchema>) {
    const { tableName } = input;
    const indexes = await this.db.all(`PRAGMA index_list("${tableName}")`);
    if (!indexes.length) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No indexes found for table "${tableName}".`,
          },
        ],
      };
    }
    const indexDescriptions = (await Promise.all(
      indexes.map(async (index) => {
        const columns = await this.indexInfo(index.name);
        return `${index.name} (${index.unique ? 'UNIQUE' : 'NON-UNIQUE'}): ${columns}`;
      }),
    )).join('\n');
    const text = `The table "${tableName}" has the following indexes:\n${indexDescriptions}`;
    return {
      content: [
        {
          type: 'text' as const,
          text,
        },
      ],
    };
  }

  private async indexInfo(indexName: string) {
    const indexInfo = await this.db.all(`PRAGMA index_info(${indexName})`);
    return indexInfo.map(column => column.name).join(', ');
  }
}
