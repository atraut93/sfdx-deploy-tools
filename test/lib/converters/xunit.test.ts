import { expect, test } from '@salesforce/command/lib/test';
import { XUnit } from '../../../src/lib/converters/xunit';

describe('xunit converter', () => {
    test.it('getFilename should return the expected value', ctx => {
        const xunit = new XUnit();
        const deployResTest = { id: 'testId' };
        expect(xunit.getFilename(deployResTest)).to.equal('testId-test-results.xml');
    });
});