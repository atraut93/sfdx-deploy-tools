import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { create } from 'xmlbuilder2';
import { exec2String } from '../../../lib/exec';
import { writeFileSync } from 'fs';
const path = require('path');
const mkdirp = require('mkdirp');

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@andrew.trautmann/sfdx-deploy-tools', 'report');

function createProperty(name: string, value: any): object {
  return {
    "@name": name,
    "@value": value
  };
}

function convertToXUnit(deployResult: any): string {
  let testResults = deployResult.details.runTestResult;
  let propertyList = [];
  let testCases = [];
  let documentEl = {
    "testSuites": {
      "testSuite": {
        "@name": "force.apex",
        "@timestamp": deployResult.startDate,
        "@hostname": "",
        "properties": {
          "property": propertyList
        },
        "testcase": testCases
      }
    }
  };

  (testResults.successes||[]).forEach(testRes => {
    testCases.push({
      "@name": testRes.methodName,
      "@classname": testRes.name,
      "@time": (+testRes.time||0)/1000.00
    });
  });

  (testResults.failures||[]).forEach(testRes => {
    testCases.push({
      "@name": testRes.methodName,
      "@classname": testRes.name,
      "@time": (+testRes.time||0)/1000.00,
      "failure": {
        "@message": testRes.message,
        "$text": testRes.stackTrace
      }
    });
  });

  documentEl.testSuites.testSuite["@tests"] = deployResult.numberTestsTotal;
  documentEl.testSuites.testSuite["@failures"] = deployResult.numberTestErrors;
  documentEl.testSuites.testSuite["@errors"] = 0;
  documentEl.testSuites.testSuite["@time"] = testResults.totalTime;

  propertyList.push(createProperty("outcome", deployResult.status));
  propertyList.push(createProperty("testsRan", deployResult.numberTestsTotal));
  propertyList.push(createProperty("passing", deployResult.numberTestsCompleted));
  propertyList.push(createProperty("failing", deployResult.numberTestsTotal));
  propertyList.push(createProperty("skipped", 0));

  return ''+create({ encoding: "UTF-8" }, documentEl).end({ prettyPrint: true });
}

export default class Report extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    format: flags.enum({
      char: 'f',
      description: messages.getMessage('formatFlagDescription'),
      options: ['xunit'],
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

    //get deploy id either from parameter or latest deploy result run
    if (!this.flags.quiet) { this.ux.startSpinner('Getting deploy result'); }
    let deployId;
    let deployRes;
    if (this.flags.deployid) {
      deployId = this.flags.deployid;
    } else if (this.flags.latest) {
      //Get latest deploy id from force:mdapi:deploy:report call
      const response = await exec2String(`sfdx force:mdapi:deploy:report -u ${this.org.getUsername()} | grep "0Af"`);
      const regex = /(0Af\w{12,15})/.exec(response);
      if (regex && regex.length > 0) {
        deployId = regex[0];
      }
      deployId = regex ? regex[0] : null;
    }

    if (!deployId) {
      if (!this.flags.quiet) { this.ux.stopSpinner(); }
      throw new SfdxError('deploy id could not be found');
    }
    
    deployRes = await conn.metadata.checkDeployStatus(deployId, true);
    if (!this.flags.quiet) { this.ux.stopSpinner(); }

    if (!this.flags.quiet) { this.ux.startSpinner('Processing test results'); }
    let outputString: string;
    let outputFilename: string;
    switch (this.flags.format) {
      case 'xunit':
        outputString = convertToXUnit(deployRes);
        outputFilename = `${deployRes.id}-test-results.xml`;
        break;
      default:
        break;
    }
    if (!this.flags.quiet) { this.ux.stopSpinner(); }

    if (this.flags.verbose) {
      this.ux.log(outputString);
    }

    if (this.flags.outputdir && outputFilename) {
      const finalDirectory = path.resolve(this.flags.outputdir);
      await mkdirp(finalDirectory);
      if (!this.flags.quiet) { this.ux.startSpinner(`Writing result file to ${this.flags.outputdir}/${outputFilename}`); }
      writeFileSync(path.resolve(finalDirectory, outputFilename), outputString);
      if (!this.flags.quiet) { this.ux.stopSpinner(); }
    }

    // Return an object to be displayed with --json
    return deployRes;
  }
}
