import * as fs from 'fs';
import * as sinon from 'sinon';
import { join } from 'path';
import { expect, test } from '@salesforce/command/lib/test';
import { LCovText } from '../../../../src/lib/coverage/converters/lcov-text';
import { CodeCoverageSummary, CodeStructure, CodeType } from '../../../../src/lib/coverage/converters';

// TODO: Finalize test method names

const createTestCoverage = (): Map<string, CodeCoverageSummary> => {
    const summByName = new Map<string, CodeCoverageSummary>();

    const codeSumm1 = new CodeCoverageSummary('testId1', 'Class1', CodeType.CLASS);
    codeSumm1.addCoveredLine(1);
    codeSumm1.addCoveredLine(1);
    codeSumm1.addCoveredLine(2);
    codeSumm1.addCoveredLine(3);
    codeSumm1.addUncoveredLine(4);
    codeSumm1.addUncoveredLine(5);
    summByName.set('Class1', codeSumm1);

    const codeSumm2 = new CodeCoverageSummary('testId2', 'Class2', CodeType.TRIGGER);
    codeSumm2.addCoveredLine(1);
    codeSumm2.addCoveredLine(1);
    codeSumm2.addCoveredLine(2);
    codeSumm2.addCoveredLine(3);
    codeSumm2.addUncoveredLine(4);
    codeSumm2.addUncoveredLine(5);
    summByName.set('Class2', codeSumm2);
    return summByName;
};

const checkFileData = (fileData, expectedSourcePath): void => {
    fileData.split('\n').forEach((line, idx) => {
        const lineParts = line.split(':');
        const key = lineParts[0];
        const value = lineParts.length > 1 ? lineParts[1] : '';
        if (idx === 0) {
            expect(key).to.equal('TN');
        } else if (key === 'SF') { // Filename
            expect(value).to.exist;
            expect(value.indexOf(join(expectedSourcePath, 'main', 'default'))).to.equal(0);
        } else if (key === 'DA') { // Line coverage
            expect(value).to.exist;
            const lineInfo = value.split(',');
            expect(lineInfo.length).to.equal(2);
            if (lineInfo[0] === '1') {
                expect(lineInfo[1]).to.equal('2');
            } else if (lineInfo[0] === '2' || lineInfo[0] === '3') {
                expect(lineInfo[1]).to.equal('1');
            } else {
                expect(lineInfo[1]).to.equal('0');
            }
        } else if (key === 'LF') { // Total lines
            expect(value).to.equal('5');
        } else if (key === 'LH') { // Total coverage
            expect(value).to.equal('3');
        }
    });
};

describe('lcov-text converter', () => {
    test.it('getFilename should return the expected value', () => {
        const lcovText = new LCovText();
        expect(lcovText.getFilename()).to.equal('coverage.lcov');
    });

    test.it('empty file should be created if no coverage data provided', () => {
        const lcovText = new LCovText();
        const coverageData: Map<string, CodeCoverageSummary> = new Map<string, CodeCoverageSummary>();
        let fileData = lcovText.convert(coverageData, []);
        expect(fileData).to.equal('');

        coverageData.set('testClass', new CodeCoverageSummary('testId', 'testClass', CodeType.CLASS));
        fileData = lcovText.convert(coverageData, []);
        expect(fileData).to.equal('');
    });

    test.it('coverage summary with 1 codeDir should generate correctly', () => {
        sinon.stub(fs, 'existsSync').returns(true);
        const lcovText = new LCovText();

        const codeDirs = [new CodeStructure(true, 'force-app')];
        const fileData = lcovText.convert(createTestCoverage(), codeDirs);

        expect(fileData).to.exist;
        expect(fileData.length).to.be.greaterThan(0);

        checkFileData(fileData, 'force-app');
    });

    test.it('coverage summary with 2 codeDirs should generate correctly', () => {
        sinon.stub(fs, 'existsSync').returns(true);
        const lcovText = new LCovText();
        const codeDirs = [new CodeStructure(false, 'second-app'), new CodeStructure(false, 'force-app')];
        const fileData = lcovText.convert(createTestCoverage(), codeDirs);

        expect(fileData).to.exist;
        expect(fileData.length).to.be.greaterThan(0);

        checkFileData(fileData, 'second-app');
    });

    test.it('coverage summary with 2 codeDirs but not found should generate correctly', () => {
        sinon.stub(fs, 'existsSync').returns(false);
        const lcovText = new LCovText();
        const codeDirs = [new CodeStructure(false, 'force-app'), new CodeStructure(true, 'default-app')];
        const fileData = lcovText.convert(createTestCoverage(), codeDirs);

        expect(fileData).to.exist;
        expect(fileData.length).to.be.greaterThan(0);

        checkFileData(fileData, 'default-app');
    });

    test.it('coverage summary with 2 codeDirs but not found and no default should generate correctly', () => {
        sinon.stub(fs, 'existsSync').returns(false);
        const lcovText = new LCovText();
        const codeDirs = [new CodeStructure(false, 'force-app'), new CodeStructure(false, 'second-app')];
        const fileData = lcovText.convert(createTestCoverage(), codeDirs);

        expect(fileData).to.exist;
        expect(fileData.length).to.be.greaterThan(0);

        checkFileData(fileData, '');
    });

    afterEach(() => {
        sinon.restore();
    });
});