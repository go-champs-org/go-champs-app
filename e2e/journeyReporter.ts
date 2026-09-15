import { mkdirSync, writeFileSync } from 'node:fs';
import type { FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';
import { journeys } from './journeys';

export default class JourneyReporter implements Reporter {
  private projects = new Map<string, Set<string>>();

  onBegin(_config: unknown, suite: Suite) {
    for (const test of suite.allTests()) this.projects.set(test.parent.project()!.name, new Set());
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const id = /^\[([^\]]+)\]/.exec(test.title)?.[1];
    if (id && result.status === 'passed') this.projects.get(test.parent.project()!.name)!.add(id);
  }

  async onEnd(_result: FullResult): Promise<void | { status: 'failed' }> {
    const reports = [...this.projects].map(([project, passed]) => {
      const ids = Object.keys(journeys);
      const covered = ids.filter((id) => passed.has(id));
      return { project, covered: covered.length, total: ids.length,
        percent: 100 * covered.length / ids.length, missing: ids.filter((id) => !passed.has(id)) };
    });
    mkdirSync('test-results', { recursive: true });
    writeFileSync('test-results/journey-coverage.json', JSON.stringify({ metric: 'implemented user journeys, not source code coverage', minimum: 90, reports }, null, 2));
    for (const report of reports) console.log(`E2E ${report.project}: ${report.covered}/${report.total} journeys (${report.percent.toFixed(1)}%)`);
    if (reports.length === 0 || reports.some((report) => report.percent < 90)) {
      return { status: 'failed' as const };
    }
  }
}
