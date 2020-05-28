import { expect, test } from '@salesforce/command/lib/test';
import converters, { CodeCoverageSummary, CodeStructure, CodeType } from '../../../src/lib/coverage/converters';

describe('coverage converters', () => {
    test.it('the expected coverage converters should exist', () => {
        expect(converters['lcov-text']).to.exist;
    });

    test.it('code structures should instantiate as expected', () => {
        const codeStruct: CodeStructure = new CodeStructure(true, 'force-app');
        expect(codeStruct.isDefault).to.be.true;
    });

    test.it('code coverage summary for a class should instantiate as expected', () => {
        const covSummary: CodeCoverageSummary = new CodeCoverageSummary('testId', 'ClassName', CodeType.CLASS);
        expect(covSummary.id).to.equal('testId');
        expect(covSummary.apexName).to.equal('ClassName');
        expect(covSummary.type).to.equal(CodeType.CLASS);
        expect(covSummary.coveringTests).to.exist;
        expect(covSummary.coveringTests.length).to.equal(0);
        expect(covSummary.lines).to.exist;
        expect(covSummary.lines.size).to.equal(0);
        expect(covSummary.getFullName()).to.equal('ClassName.cls');
    });

    test.it('code coverage summary for a trigger should instantiate as expected', () => {
        const covSummary: CodeCoverageSummary = new CodeCoverageSummary('testId', 'TriggerName', CodeType.TRIGGER);
        expect(covSummary.id).to.equal('testId');
        expect(covSummary.apexName).to.equal('TriggerName');
        expect(covSummary.type).to.equal(CodeType.TRIGGER);
        expect(covSummary.coveringTests).to.exist;
        expect(covSummary.coveringTests.length).to.equal(0);
        expect(covSummary.lines).to.exist;
        expect(covSummary.lines.size).to.equal(0);
        expect(covSummary.getFullName()).to.equal('TriggerName.trigger');
    });

    test.it('code coverage summary should handle adding lines', () => {
        const covSummary: CodeCoverageSummary = new CodeCoverageSummary('testId', 'TriggerName', CodeType.TRIGGER);
        covSummary.addCoveredLine(10);
        expect(covSummary.getNumLines()).to.equal(1);
        expect(covSummary.getNumCoveredLines()).to.equal(1);

        covSummary.addUncoveredLine(10);
        expect(covSummary.getNumLines()).to.equal(1);
        expect(covSummary.getNumCoveredLines()).to.equal(1);

        covSummary.addUncoveredLine(11);
        expect(covSummary.getNumLines()).to.equal(2);
        expect(covSummary.getNumCoveredLines()).to.equal(1);

        covSummary.addCoveredLine(11);
        expect(covSummary.getNumLines()).to.equal(2);
        expect(covSummary.getNumCoveredLines()).to.equal(2);
    });
});