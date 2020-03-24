import { expect, test } from '@salesforce/command/lib/test';
import converters from '../../src/lib/converters';

describe('all converters', () => {
    test.it('the expected converters should exist', () => {
        expect(converters['xunit']).to.exist;
    });
});