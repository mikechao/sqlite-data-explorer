import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

export class SqliteMcpServer {
  private server: McpServer;

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
