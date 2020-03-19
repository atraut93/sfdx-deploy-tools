import { flags, SfdxCommand } from '@salesforce/command';
import { Messages, SfdxError } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { create } from 'xmlbuilder2';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('@atraut93/sfdx-deploy-tools', 'report');

// The type we are querying for
interface ApexClass {
  Name: string;
}
interface ApexTestResult {
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

function convertToJUnit(deployResult: any, testResults: Array<ApexTestResult>): string {
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

  let xmlString = ''+create({"encoding": "UTF-8"}, documentEl).end({prettyPrint:true});
  console.log(xmlString);
  return xmlString;
}

export default class Report extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx deploytools:test:report --targetusername myOrg@example.com
  Hello world! This is org: MyOrg and I will be around until Tue Mar 20 2018!
  `
  ];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    format: flags.enum({
      char: 'f',
      description: messages.getMessage('formatFlagDescription'),
      options: ['junit'],
      default: 'junit'
    }),
    deployid: flags.string({
      char: 'd',
      description: messages.getMessage('deployidFlagDescription'),
      required: true
    }),
    quiet: flags.builtin()
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = true;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {

    // this.org is guaranteed because requiresUsername=true, as opposed to supportsUsername
    const conn = this.org.getConnection();
    
    const deployRes = await conn.request(`/services/data/v48.0/metadata/deployRequest/${this.flags.deployid}`);
    const query = `SELECT ApexClass.Name, Id, Message, MethodName, Outcome, RunTime, StackTrace, TestTimestamp
    FROM ApexTestResult
    WHERE TestTimestamp >= ${deployRes.deployResult.startDate} AND TestTimestamp <= ${deployRes.deployResult.completedDate}
    ORDER BY ApexClass.Name ASC, MethodName ASC`;
    // Query the org
    const result = await conn.query<ApexTestResult>(query);

    // Organization will always return one result, but this is an example of throwing an error
    // The output and --json will automatically be handled for you.
    if (!result.records || result.records.length <= 0) {
      throw new SfdxError(messages.getMessage('errorNoOrgResults', [this.org.getOrgId()]));
    }

    let outputString = convertToJUnit(deployRes.deployResult, result.records);
    // if (!this.flags.quiet) {
    //   this.ux.log(outputString);
    // }

    // result.records.forEach(element => {
    //   if (!this.flags.quiet) {
    //     this.ux.log(`${element.ApexClass.Name}.${element.MethodName}: ${element.Outcome} in ${element.RunTime||0}ms`);
    //   }
    // });

    // Return an object to be displayed with --json
    return { orgId: this.org.getOrgId(), outputString };
  }
}
