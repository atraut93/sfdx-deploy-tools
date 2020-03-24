import { expect, test } from '@salesforce/command/lib/test';
import { exec, exec2JSON, exec2String } from '../../src/lib/exec';

describe('exec', () => {
    test.it('exec should return the expected output unchanged', () => {
        exec('echo "  Hello   "').then(({stdout, stderr}) => {
            expect(stdout).to.equal('  Hello   \n');
        });
    });

    test.it('exec2String should return the expected output as a trimmed string', async () => {
        const returnValue = await exec2String('echo "  Hello   "');
        expect(returnValue).to.equal('Hello');
    });

    test.it('exec2JSON should return the expected output as JSON', async () => {
        const returnValue = await exec2JSON('echo "{\\"jsonvalue\\": [1, 2, 3]}"');
        expect(returnValue).to.deep.equal({'jsonvalue': [1,2,3]});
    });
});