import { existsSync } from 'fs';
import { join } from 'path';
import { CodeCoverageConverter, CodeCoverageSummary, CodeStructure, CodeType } from '../converters';

export class LCovText implements CodeCoverageConverter {
    public convert = (coverageData: Map<string, CodeCoverageSummary>, codeDirectories: CodeStructure[]): string => {
        const defaultDir = codeDirectories.length > 1 ? codeDirectories.find((d: CodeStructure) => d.isDefault) : codeDirectories[0];

        const outputLines: string[] = [];
        outputLines.push('TN:');
        coverageData.forEach((coverage: CodeCoverageSummary) => {
            const endPath = join('main', 'default', (coverage.type === CodeType.CLASS ? 'classes' : 'triggers'), coverage.getFullName());
            let foundDir = defaultDir;
            if (codeDirectories.length > 1) {
                foundDir = codeDirectories.find((d: CodeStructure) => existsSync(join(d.sourcePath, endPath)));
            }
            const sourceDir = (foundDir ? foundDir.sourcePath : (defaultDir ? defaultDir.sourcePath : ''));

            outputLines.push(`SF:${join(sourceDir, endPath)}`);
            coverage.lines.forEach((numExec: number, lineNum: string) => {
                outputLines.push(`DA:${lineNum},${numExec}`);
            });
            outputLines.push(`LF:${coverage.getNumLines()}`);
            outputLines.push(`LH:${coverage.getNumCoveredLines()}`);
            outputLines.push('end_of_record');
        });
        return outputLines.join('\n');
    };

    public getFilename = (): string => {
        return 'coverage.lcov';
    }
}
