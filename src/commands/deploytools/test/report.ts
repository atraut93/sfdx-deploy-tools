import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';

import { exec2String } from '../../../lib/exec';
import converters from '../../../lib/report/converters';
import { TestResultConverter } from '../../../lib/report/converters';

import { writeFileSync } from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@andrew.trautmann/sfdx-deploy-tools', 'report');

export default class Report extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    'sfdx deploytools:test:report -u <org alias> -l',
    'sfdx deploytools:test:report -u <org alias> -l -d test-results',
    'sfdx deploytools:test:report -u <org alias> -i <deploy id>',
    'sfdx deploytools:test:report -u <org alias> -i <deploy id> -d test-results',
    'sfdx deploytools:test:report -u <org alias> -i <deploy id> -d test-results -f xunit'
  ];

  protected static flagsConfig = {
    format: flags.enum({
      char: 'f',
      description: messages.getMessage('formatFlagDescription'),
      options: Object.keys(converters),
      default: 'xunit'
    }),
    deployid: flags.string({
      char: 'i',
      description: messages.getMessage('deployidFlagDescription'),
      exclusive: ['latest']
    }),
    latest: flags.boolean({
      char: 'l',
      description: messages.getMessage('latestFlagDescription'),
      exclusive: ['deployid']
    }),
    source: flags.boolean({
      char: 's',
      description: messages.getMessage('sourceFlagDescription')
    }),
    outputdir: flags.directory({
      char: 'd',
      description: messages.getMessage('outputdirFlagDescription')
    }),
    quiet: flags.builtin(),
    verbose: flags.builtin()
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    if (!this.flags.latest && !this.flags.deployid) {
      throw new SfdxError(messages.getMessage('errorFlagRequired'));
    }

    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const conn = this.org.getConnection();

    // get deploy id either from parameter or latest deploy result run
    if (!this.flags.quiet && !this.flags.json) { this.ux.startSpinner(messages.getMessage('spinnerGettingDeployResults')); }
    let deployId;
    let deployRes;
    if (this.flags.deployid) {
      deployId = this.flags.deployid;
    } else if (this.flags.latest) {
      // Get latest deploy id from force:mdapi:deploy:report call
      const callType = this.flags.source ? 'source' : 'mdapi';
      const response = await exec2String(`sfdx force:${callType}:deploy:report -u ${this.org.getUsername()} | grep "0Af"`);
      const regex = /(0Af\w{12,15})/.exec(response);
      if (regex && regex.length > 0) {
        deployId = regex[0];
      }
      deployId = regex ? regex[0] : null;
    }

    if (!deployId) {
      if (!this.flags.quiet && !this.flags.json) { this.ux.stopSpinner(); }
      throw new SfdxError('deploy id could not be found');
    }

    deployRes = await conn.metadata.checkDeployStatus(deployId, true);
    if (!this.flags.quiet && !this.flags.json) { this.ux.stopSpinner(); }

    if (!this.flags.quiet && !this.flags.json) { this.ux.startSpinner(messages.getMessage('spinnerProcessingTestResults')); }
    const converter: TestResultConverter = converters[this.flags.format];
    const outputString: string = converter.convert(deployRes, conn);
    const outputFilename: string = converter.getFilename(deployRes);
    if (!this.flags.quiet && !this.flags.json) { this.ux.stopSpinner(); }

    if (this.flags.verbose && !this.flags.json) {
      this.ux.log(outputString);
    }

    if (this.flags.outputdir && outputFilename) {
      const finalDirectory = path.resolve(this.flags.outputdir);
      await mkdirp(finalDirectory);
      if (!this.flags.quiet && !this.flags.json) { this.ux.startSpinner(messages.getMessage('spinnerWritingFile', [`${this.flags.outputdir}${path.sep}${outputFilename}`])); }
      writeFileSync(path.resolve(finalDirectory, outputFilename), outputString);
      if (!this.flags.quiet && !this.flags.json) { this.ux.stopSpinner(); }
    }

    // Return an object to be displayed with --json
    return deployRes;
  }
}
