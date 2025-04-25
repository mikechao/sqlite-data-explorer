import type { Database } from 'sqlite';
import type sqlite3 from 'sqlite3';
import { z } from 'zod';
import { BaseTool } from './BaseTool';

const foreignKeyForTableInputSchema = z.object({
  tableName: z.string().describe('The name of the table to get indexes for.'),
});

export class ForeignKeyForTableTool extends BaseTool<typeof foreignKeyForTableInputSchema, any> {
  public readonly name = 'foreign_key_for_table';
  public readonly description = 'Get foreign keys for a table in the database.';
  public readonly inputSchema = foreignKeyForTableInputSchema;

  constructor(private db: Database<sqlite3.Database, sqlite3.Statement>) {
    super();
  }

  public async executeCore(input: z.infer<typeof foreignKeyForTableInputSchema>) {
    const { tableName } = input;
    const foreignKeys = await this.db.all(`PRAGMA foreign_key_list("${tableName}")`);
    if (!foreignKeys.length) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No foreign keys found for table "${tableName}".`,
          },
        ],
      };
    }
    const foreignKeyDescriptions = (await Promise.all(
      foreignKeys.map(async (foreignKey) => {
        return `${foreignKey.from} -> ${foreignKey.table}(${foreignKey.to})`;
      }),
    )).join('\n');
    const text = `The table "${tableName}" has the following foreign keys:\n${foreignKeyDescriptions}`;
    return {
      content: [
        {
          type: 'text' as const,
          text,
        },
      ],
    };
  }
}
