import type { Database } from 'sqlite';
import { get } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { getExplorerPrompt } from './prompts/Explorer.js';
import { AppendInsightsTool } from './tools/AppendInsightsTool.js';
import { DescribeTableTool } from './tools/DescribeTableTool.js';
import { ExecuteQueryTool } from './tools/ExecuteQueryTool.js';
import { ForeignKeyForTableTool } from './tools/ForeignKeyForTableTool.js';
import { IndexesForTableTool } from './tools/IndexesForTableTool.js';
import { ListTablesTool } from './tools/ListTablesTool.js';

export class SqliteMcpServer {
  private server: McpServer;
  private db!: Database<sqlite3.Database, sqlite3.Statement>;
  private listTablesTool!: ListTablesTool;
  private describeTableTool!: DescribeTableTool;
  private indexesForTableTool!: IndexesForTableTool;
  private foreignKeyForTableTool!: ForeignKeyForTableTool;
  private readyQueryTool!: ExecuteQueryTool;
  private appendInsightsTool!: AppendInsightsTool;
  private insights: string[] = [];
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
          resources: {},
          prompts: {},
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
        this.readyQueryTool = new ExecuteQueryTool(db);
        this.insights = [];
        this.appendInsightsTool = new AppendInsightsTool(this.insights, this.server);

        this.setupTools();
        this.setupPrompt();
        this.setupResources();
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
    this.server.tool(
      this.appendInsightsTool.name,
      this.appendInsightsTool.description,
      this.appendInsightsTool.inputSchema.shape,
      this.appendInsightsTool.execute.bind(this.appendInsightsTool),
    );
  }

  private setupPrompt(): void {
    this.server.prompt(
      'data-explorer',
      'Explores the SQLite database and create a dashboard.',
      {},
      async () => {
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: getExplorerPrompt(),
              },
            },
          ],
        };
      },
    );
  }

  private getInsights(): string {
    if (this.insights.length === 0) {
      return 'No insights available.';
    }
    const text = `📊 Business Intelligence Memo 📊\nKey Insights Discovered:\n${
      this.insights.map((insight, index) => `\n${index + 1}. ${insight}`).join('\n')}`;
    return text;
  }

  private setupResources(): void {
    this.server.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'memo://insights',
          mimeType: 'text/plain',
          name: 'Business Insights',
        },
      ],
    }));

    this.server.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri.toString();
      if (uri.startsWith('memo://')) {
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: this.getInsights(),
            },
          ],
        };
      }
      return {
        content: [{ type: 'text', text: `Resource not found: ${uri}` }],
        isError: true,
      };
    });
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
