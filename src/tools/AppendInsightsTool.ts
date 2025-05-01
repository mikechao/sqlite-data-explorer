import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { BaseTool } from './BaseTool.js';

const appendInsightsInputSchema = z.object({
  insights: z.string().describe('Business insight discovered from data analysis'),
});

export class AppendInsightsTool extends BaseTool<typeof appendInsightsInputSchema, any> {
  public readonly name = 'append_insights';
  public readonly description = 'Add a business insight to the memo';
  public readonly inputSchema = appendInsightsInputSchema;

  constructor(private insights: string[], private mcpServer: McpServer) {
    super();
  }

  public async executeCore(input: z.infer<typeof appendInsightsInputSchema>) {
    const { insights } = input;
    this.insights.push(insights);
    this.mcpServer.sendResourceListChanged();
    return {
      content: [
        {
          type: 'text' as const,
          text: `Insights appended successfully.`,
        },
      ],
    };
  }
}
