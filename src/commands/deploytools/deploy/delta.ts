import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson, ensureArray } from '@salesforce/ts-types';
import * as gitP from 'simple-git/promise';
import { SimpleGit } from 'simple-git/promise';
import { CodeStructure } from '../../../lib/coverage/converters';
import { exec2JSON } from '../../../lib/exec';

const git: SimpleGit = gitP();

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@andrew.trautmann/sfdx-deploy-tools', 'delta');

export default class Delta extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
    'sfdx deploytools:deploy:delta -u <org alias>'
  ];

  protected static flagsConfig = {
    from: flags.string({
      char: 'f',
      description: messages.getMessage('fromFlagDescription'),
      required: true
    }),
    checkonly: flags.boolean({
      char: 'c',
      description: messages.getMessage('passthroughFlagDescription')
    }),
    ignorewarnings: flags.boolean({
      char: 'g',
      description: messages.getMessage('passthroughFlagDescription')
    }),
    testlevel: flags.enum({
      char: 'l',
      description: messages.getMessage('passthroughFlagDescription'),
      options: ['NoTestRun', 'RunSpecifiedTests', 'RunLocalTests', 'RunAllTestsInOrg']
    }),
    ignoreerrors: flags.boolean({
      char: 'o',
      description: messages.getMessage('passthroughFlagDescription')
    }),
    runtests: flags.array({
      char: 'r',
      description: messages.getMessage('passthroughFlagDescription')
    }),
    wait: flags.integer({
      char: 'w',
      description: messages.getMessage('passthroughFlagDescription')
    }),
    quiet: flags.builtin(),
    verbose: flags.builtin()
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = true;

  private loggingEnabled;

  private getPassthroughParams(): string {
    const paramList: string[] = [];
    if (this.flags.checkonly) {
      paramList.push(`-${Delta.flagsConfig.checkonly.char}`);
    }

    if (this.flags.ignorewarnings) {
      paramList.push(`-${Delta.flagsConfig.ignorewarnings.char}`);
    }

    if (this.flags.testlevel && this.flags.testlevel.length > 0) {
      paramList.push(`-${Delta.flagsConfig.testlevel.char} ${this.flags.testlevel}`);
    }

    if (this.flags.ignoreerrors) {
      paramList.push(`-${Delta.flagsConfig.ignoreerrors.char}`);
    }

    if (this.flags.runtests && this.flags.runtests.length > 0) {
      paramList.push(`-${Delta.flagsConfig.runtests.char} ${this.flags.runtests.join(',')}`);
      if (!this.flags.testlevel || this.flags.testlevel.length < 0) {
        paramList.push(`-${Delta.flagsConfig.testlevel.char} RunSpecifiedTests`);
      }
    }

    if (this.flags.wait || this.flags.wait === 0) {
      paramList.push(`-${Delta.flagsConfig.wait.char} ${this.flags.wait}`);
    }

    return paramList.join(' ');
  }

  public async run(): Promise<AnyJson> {
    this.loggingEnabled = (!this.flags.quiet && !this.flags.json);
    const projectConfig = await this.project.resolveProjectConfig();
    const sourcePaths: CodeStructure[] = ensureArray(projectConfig.packageDirectories).map(value => new CodeStructure(value['default'], value['path']));

    const allDiffs = [];

    if (this.loggingEnabled) { this.ux.startSpinner(messages.getMessage('spinnerGettingChanges')); }
    for (const path of sourcePaths) {
      const diffValues = await git.diff(['--name-only', '--diff-filter=d', this.flags.from, '--', path.sourcePath]);
      diffValues.split('\n').forEach(val => {
        if (val && val.trim().length > 0) {
          allDiffs.push(val.trim().replace(/ /g, '\\ ').replace(/\$/g, '\\$'));
        }
      });
    }
    if (this.loggingEnabled) { this.ux.stopSpinner(); }

    if (allDiffs.length === 0) {
      if (this.loggingEnabled) { this.ux.log(messages.getMessage('nothingToDeploy')); }
      return messages.getMessage('nothingToDeploy');
    }

    if (this.loggingEnabled) { this.ux.startSpinner(messages.getMessage('deployingMessage', [allDiffs.length])); }
    const jsonResponse = await exec2JSON(`sfdx force:source:deploy -u ${this.org.getUsername()} -p ${allDiffs.join(',')} ${this.getPassthroughParams()} --json`);
    if (this.loggingEnabled) { this.ux.stopSpinner(); }

    if (this.loggingEnabled && jsonResponse.exitCode > 0) {
      this.ux.log('Deploy Failed');
      if (jsonResponse.name === 'DeployFailed' && jsonResponse.result && Array.isArray(jsonResponse.result)) {
        this.ux.log('Deploy Failures:');
        jsonResponse.result.forEach((element, idx: number) => {
          if (element.error === 'Unknown') {
            this.ux.log(`${idx + 1}. Unknown error; check the deploy result in Salesforce or run \`sfdx force:source:deploy:report\``);
          } else {
            this.ux.log(`${idx + 1}. ${element.type}: ${element.fullName}: ${element.problemType} ${element.error}`);
          }
        });
      } else if (jsonResponse.name === 'testFailure' && jsonResponse.result && jsonResponse.result.details && jsonResponse.result.details.runTestResult) {
        const testResults = jsonResponse.result.details.runTestResult;
        this.ux.log(`${testResults.numFailures} of ${testResults.numTestsRun} tests failed`);
        if (testResults.failures && Array.isArray(testResults.failures)) {
          testResults.failures.forEach((element, idx: number) => {
            this.ux.log(`${idx + 1}. ${element.stackTrace}\n\t${element.message}`);
          });
        }
      } else if (jsonResponse.message) {
        this.ux.log(`1. ${jsonResponse.message}`);
      }
    }

    // Return an object to be displayed with --json
    return (jsonResponse && jsonResponse.result) ? jsonResponse.result : jsonResponse;
  }
}
