import { VerificationSummary } from '../../types/autonomousAgent';
import { AgentToolRegistry } from '../agentToolRegistry';

export class AutonomousVerificationService {
  public static async runVerification(
    toolRegistry: AgentToolRegistry,
    filesModifiedGlobally: Set<string>,
    commandsExecutedGlobally: Array<{ command: string; exitCode: number; success: boolean }>
  ): Promise<VerificationSummary> {
    // 1. Project Type Check
    const finalLint = await toolRegistry.executeTool('type_check', {});
    // 2. Project Unit Tests
    const finalTests = await toolRegistry.executeTool('run_tests', {});

    commandsExecutedGlobally.push({
      command: 'npm test',
      exitCode: finalTests.success ? 0 : 1,
      success: finalTests.success,
    });

    return {
      filesChanged: Array.from(filesModifiedGlobally),
      commandsExecuted: commandsExecutedGlobally,
      testsPassed: finalTests.data?.passed || (finalTests.success ? 1 : 0),
      testsFailed: finalTests.data?.failed || (!finalTests.success ? 1 : 0),
      testErrors: finalTests.error ? [finalTests.error] : [],
      typeCheckPassed: finalLint.success,
      typeCheckErrors: finalLint.error ? [finalLint.error] : [],
      checksNotRun: ['Full browser visual regression', 'Cloud deployment check'],
      remainingRisks: finalTests.success && finalLint.success
        ? []
        : ['Some assertions or type rules need manual confirmation'],
      overallSuccess: finalLint.success && finalTests.success,
      timestamp: Date.now(),
    };
  }

  public static createEmptyVerification(): VerificationSummary {
    return {
      filesChanged: [],
      commandsExecuted: [],
      testsPassed: 0,
      testsFailed: 0,
      typeCheckPassed: true,
      checksNotRun: [],
      remainingRisks: [],
      overallSuccess: false,
      timestamp: Date.now(),
    };
  }
}
