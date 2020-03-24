import { expect, test } from '@salesforce/command/lib/test';
// import { ensureJsonMap, ensureString } from '@salesforce/ts-types';

describe('deploytools:test:report', () => {
  test
    .withOrg({ username: 'test@org.com' }, true)
    .stderr()
    .stdout()
    .command(['deploytools:test:report', '--targetusername', 'test@org.com'])
    .it('deploytools:test:report without required parameter should throw error', ctx => {
      expect(ctx.stderr).to.contain('ERROR running deploytools:test:report');
    });

  // test
  //   .withOrg({ username: 'test@org.com' }, true)
  //   .withConnectionRequest(request => {
  //     const requestMap = ensureJsonMap(request);
  //     if (ensureString(requestMap.url).match(/deploy/)) {
  //       return Promise.resolve({ id: '0Af123123123123123' });
  //     }
  //     return Promise.resolve({ records: [] });
  //   })
  //   .stderr()
  //   .stdout()
  //   .command(['deploytools:test:report', '--targetusername', 'test@org.com', '--deployid', '0Af123123123123123'])
  //   .it('deploytools:test:report with latest parameter should display messages', ctx => {
  //     expect(ctx.stdout).to.contain('Getting deploy result');
  //     expect(ctx.stderr).to.be.empty;
  //   });
});
