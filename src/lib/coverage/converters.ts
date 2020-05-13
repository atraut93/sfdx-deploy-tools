import { LCovText } from './converters/lcov-text';

export interface CodeCoverageConverter {
    convert(coverageData: Map<string, CodeCoverageSummary>, codeDirectories: CodeStructure[]): string;
    getFilename(): string;
}

export class CodeStructure {
    isDefault: boolean;
    sourcePath: string;

    constructor(isDefault: boolean, sourcePath: string) {
        this.isDefault = isDefault;
        this.sourcePath = sourcePath;
    }
}

export enum CodeType {
    CLASS,
    TRIGGER
}

export class CodeCoverageSummary {
    id: string;
    apexName: string;
    type: CodeType;
    coveringTests: string[];
    lines: Map<string, number>;

    constructor(id: string, apexName: string, type: CodeType) {
        this.id = id;
        this.apexName = apexName;
        this.type = type;
        this.coveringTests = [];
        this.lines = new Map<string, number>();
    }

    addCoveredLine(lineNum: number): void {
        const lineStr: string = '' + lineNum;
        if (this.lines.has(lineStr)) {
            this.lines.set(lineStr, this.lines.get(lineStr) + 1);
        } else {
            this.lines.set(lineStr, 1);
        }
    }

    addUncoveredLine(lineNum: number): void {
        const lineStr: string = '' + lineNum;
        if (!this.lines.has(lineStr)) {
            this.lines.set(lineStr, 0);
          }
    }

    getNumLines(): number {
        return this.lines.size;
    }

    getNumCoveredLines(): number {
        let numCovered = 0;
        this.lines.forEach((numExec: number) => {
            if (numExec > 0) {
                numCovered++;
            }
        });
        return numCovered;
    }

    getFullName(): string {
        return this.apexName + '.' + (this.type === CodeType.TRIGGER ? 'trigger' : 'cls');
    }
}

export default {
    'lcov-text': new LCovText()
};
