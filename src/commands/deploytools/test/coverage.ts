import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson, ensureArray } from '@salesforce/ts-types';

import converters, { CodeCoverageConverter, CodeCoverageSummary, CodeStructure, CodeType } from '../../../lib/coverage/converters';

import { writeFileSync } from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@andrew.trautmann/sfdx-deploy-tools', 'coverage');

export default class Report extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    'sfdx deploytools:test:coverage -u <org alias>',
    'sfdx deploytools:test:coverage -u <org alias> -f lcov-text'
  ];

  protected static flagsConfig = {
    format: flags.enum({
      char: 'f',
      description: messages.getMessage('formatFlagDescription'),
      options: Object.keys(converters),
      default: 'lcov-text'
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
  protected static requiresProject = true;

  public async run(): Promise<AnyJson> {

    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const conn = this.org.getConnection();
    const projectConfig = await this.project.resolveProjectConfig();
    const sourcePaths: CodeStructure[] = ensureArray(projectConfig.packageDirectories).map(value => new CodeStructure(value['default'], value['path']));

    // get deploy id either from parameter or latest deploy result run
    if (!this.flags.quiet && !this.flags.json) { this.ux.startSpinner(messages.getMessage('spinnerGettingCoverageResults')); }
    const testResults = await conn.tooling.autoFetchQuery('SELECT Id, Coverage, ApexClassOrTriggerId, ApexClassOrTrigger.Name, TestMethodName FROM ApexCodeCoverage ORDER BY ApexClassOrTriggerId');
    if (!this.flags.quiet && !this.flags.json) { this.ux.stopSpinner(); }

    if (!this.flags.quiet && !this.flags.json) { this.ux.startSpinner(messages.getMessage('spinnerProcessingTestResults')); }
    const aggregateTestResults = new Map<string, CodeCoverageSummary>();

    testResults.records.forEach(element => {
      const classTrigName = element.ApexClassOrTrigger.Name;
      // let coverageObj;
      if (!aggregateTestResults.has(classTrigName)) {
        aggregateTestResults.set(classTrigName, new CodeCoverageSummary(element.ApexClassOrTriggerId, classTrigName, element.ApexClassOrTrigger.attributes.url.includes('ApexClass') ? CodeType.CLASS : CodeType.TRIGGER));
      }
      const coverageObj = aggregateTestResults.get(classTrigName);
      coverageObj.coveringTests.push(element.TestMethodName);

      element.Coverage.coveredLines.forEach(lineNum => { coverageObj.addCoveredLine(lineNum); });
      element.Coverage.uncoveredLines.forEach(lineNum => { coverageObj.addUncoveredLine(lineNum); });
    });

    const converter: CodeCoverageConverter = converters[this.flags.format];
    const outputString: string = converter.convert(aggregateTestResults, sourcePaths);
    const outputFilename: string = converter.getFilename();
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
    return JSON.parse(JSON.stringify(aggregateTestResults));
  }
}
