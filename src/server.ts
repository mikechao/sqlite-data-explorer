import type { Database } from 'sqlite';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { DescribeTableTool } from './tools/DescribeTableTool';
import { ForeignKeyForTableTool } from './tools/ForeignKeyForTableTool';
import { IndexesForTableTool } from './tools/IndexesForTableTool';
import { ListTablesTool } from './tools/ListTablesTool';
import { ReadQueryTool } from './tools/ReadQueryTool';

export class SqliteMcpServer {
  private server: McpServer;
  private db!: Database<sqlite3.Database, sqlite3.Statement>;
  private listTablesTool!: ListTablesTool;
  private describeTableTool!: DescribeTableTool;
  private indexesForTableTool!: IndexesForTableTool;
  private foreignKeyForTableTool!: ForeignKeyForTableTool;
  private readyQueryTool!: ReadQueryTool;
  public ready: Promise<void>;

  constructor(dbPath: string) {
    this.server = new McpServer(
      {
        name: 'sqlite-explorer-server',
        description: 'SQLite Explorer Server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          logging: {},
        },
      },
    );
    this.ready = this.initDatabase(dbPath)
      .then((db) => {
        this.db = db;
        this.listTablesTool = new ListTablesTool(db);
        this.describeTableTool = new DescribeTableTool(db);
        this.indexesForTableTool = new IndexesForTableTool(db);
        this.foreignKeyForTableTool = new ForeignKeyForTableTool(db);
        this.readyQueryTool = new ReadQueryTool(db);

        this.setupTools();
      })
      .catch((error) => {
        console.error(`Error initializing database: ${error}`);
        throw error;
      });
  }

  private setupTools(): void {
    this.server.tool(
      this.listTablesTool.name,
      this.listTablesTool.description,
      this.listTablesTool.inputSchema.shape,
      this.listTablesTool.execute.bind(this.listTablesTool),
    );
    this.server.tool(
      this.describeTableTool.name,
      this.describeTableTool.description,
      this.describeTableTool.inputSchema.shape,
      this.describeTableTool.execute.bind(this.describeTableTool),
    );
    this.server.tool(
      this.indexesForTableTool.name,
      this.indexesForTableTool.description,
      this.indexesForTableTool.inputSchema.shape,
      this.indexesForTableTool.execute.bind(this.indexesForTableTool),
    );
    this.server.tool(
      this.foreignKeyForTableTool.name,
      this.foreignKeyForTableTool.description,
      this.foreignKeyForTableTool.inputSchema.shape,
      this.foreignKeyForTableTool.execute.bind(this.foreignKeyForTableTool),
    );
    this.server.tool(
      this.readyQueryTool.name,
      this.readyQueryTool.description,
      this.readyQueryTool.inputSchema.shape,
      this.readyQueryTool.execute.bind(this.readyQueryTool),
    );
  }

  private async initDatabase(dbPath: string) {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    return db;
  }

  public async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.log('Server is running with Stdio transport');
  }

  public log(
    message: string,
    level: 'error' | 'debug' | 'info' | 'notice' | 'warning' | 'critical' | 'alert' | 'emergency' = 'info',
  ): void {
    this.server.server.sendLoggingMessage({
      level,
      message,
    });
  }
}
