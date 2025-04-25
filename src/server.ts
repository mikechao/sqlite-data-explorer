import type { Database } from 'sqlite';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { ListTablesTool } from './tools/ListTablesTool';
import { DescribeTableTool } from './tools/DescribeTableTool';

export class SqliteMcpServer {
  private server: McpServer;
  private db!: Database<sqlite3.Database, sqlite3.Statement>;
  private listTablesTool!: ListTablesTool;
  private describeTableTool!: DescribeTableTool;
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
    )
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
