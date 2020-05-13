import { expect, test } from '@salesforce/command/lib/test';

describe('deploytools:test:report', () => {
  test
    .withOrg({ username: 'test@org.com' }, true)
    .stderr()
    .stdout()
    .command(['deploytools:test:report', '--targetusername', 'test@org.com'])
    .it('without required parameters should throw error', ctx => {
      expect(ctx.stderr).to.contain('ERROR running deploytools:test:report');
    });
});
