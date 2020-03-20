import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { create } from 'xmlbuilder2';
import { exec2JSON } from '../../../lib/exec';
import { writeFileSync } from 'fs';
const path = require('path');
const mkdirp = require('mkdirp');

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@andrew.trautmann/sfdx-deploy-tools', 'report');

// The type we are querying for
type ApexClass = {
  Name: string;
}
type ApexTestResult = {
  Id: string;
  ApexClass: ApexClass;
  Message: string;
  MethodName: string;
  Outcome: string; //Pass, Fail, CompileFail, Skip
  RunTime: number;
  StackTrace: string;
  TestTimestamp: string;
}

function createProperty(name: string, value: any): object {
  return {
    "@name": name,
    "@value": value
  };
}

function convertToXUnit(deployResult: any, testResults: Array<ApexTestResult>): string {
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

  let numSuccess = 0;
  let numSkipped = 0;
  let numFailure = 0;
  let total = testResults.length;
  let totalTime = 0;

  testResults.forEach(testRes => {
    let resultEl = {
      "@name": testRes.MethodName,
      "@classname": testRes.ApexClass.Name,
      "@time": (testRes.RunTime||0)/1000.00,
      "failure": undefined
    };
    totalTime += (testRes.RunTime||0);
    switch (testRes.Outcome) {
      case "Pass":
        numSuccess++;
        break;
      case "Fail":
        numFailure++;
        resultEl.failure = {
          "@message": testRes.Message,
          "$text": testRes.StackTrace
        };
        break;
      case "Skip":
        numSkipped++;
        break;
      default:
        break;
    }

    testCases.push(resultEl);
  });

  documentEl.testSuites.testSuite["@tests"] = total;
  documentEl.testSuites.testSuite["@failures"] = numFailure;
  documentEl.testSuites.testSuite["@errors"] = 0;
  documentEl.testSuites.testSuite["@time"] = totalTime /1000.00;

  propertyList.push(createProperty("outcome", numFailure > 0 ? "Failed" : "Passed"));
  propertyList.push(createProperty("testsRan", total));
  propertyList.push(createProperty("passing", numSuccess));
  propertyList.push(createProperty("failing", numFailure));
  propertyList.push(createProperty("skipped", numSkipped));

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
    if (!this.flags.quiet) {
      this.ux.startSpinner('Getting deploy result');
    }
    let deployRes;
    if (this.flags.deployid) {
      let rawDeploy = await conn.request(`/services/data/v48.0/metadata/deployRequest/${this.flags.deployid}`);
      deployRes = rawDeploy['deployResult'];
    } else if (this.flags.latest) {
      deployRes = {
        startDate: '2020-03-19T14:10:04.000+0000',
        completedDate: '2020-03-19T14:11:09.000+0000',
        id: '0Af6g00000SW3ms'
      };
      const response = await exec2JSON(`sfdx force:mdapi:deploy:report -u ${this.org.getUsername()} --json`);
      deployRes = response.result;
      if (!deployRes) {
        throw new SfdxError(messages.getMessage('errorNoLatestDeploy', [response.message]));
      }
    }
    if (!this.flags.quiet) {
      this.ux.stopSpinner();
    }

    const query = `SELECT ApexClass.Name, Id, Message, MethodName, Outcome, RunTime, StackTrace, TestTimestamp
    FROM ApexTestResult
    WHERE TestTimestamp >= ${deployRes.startDate} AND TestTimestamp <= ${deployRes.completedDate}
    ORDER BY ApexClass.Name ASC, MethodName ASC`;
    // Query the org
    if (!this.flags.quiet) {
      this.ux.startSpinner('Getting test results');
    }
    const result = await conn.query<ApexTestResult>(query);
    if (!this.flags.quiet) {
      this.ux.stopSpinner();
    }

    // Organization will always return one result, but this is an example of throwing an error
    // The output and --json will automatically be handled for you.
    if (!result.records) {
      throw new SfdxError(messages.getMessage('errorNoOrgResults', [this.org.getOrgId()]));
    }

    let outputString: string;
    let outputFilename: string;
    switch (this.flags.format) {
      case 'xunit':
        outputString = convertToXUnit(deployRes, result.records);
        outputFilename = `${deployRes.id}-test-results.xml`;
        break;
      default:
        break;
    }

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
    return { orgId: this.org.getOrgId(), testResults: result.records };
  }
}
