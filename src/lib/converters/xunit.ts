import { create } from 'xmlbuilder2';
import { TestResultConverter } from '../converters';

const createProperty = (name: string, value) => {
    return {
        '@name': name,
        '@value': value
    };
};

export class XUnit implements TestResultConverter {
    public convert = (deployResult, connData): string => {
        const testResults = deployResult.details.runTestResult;
        const propertyList = [];
        const testCases = [];
        const documentEl = {
            testSuites: {
                testSuite: {
                    '@name': 'force.apex',
                    '@timestamp': deployResult.startDate,
                    '@hostname': connData.loginUrl,
                    properties: {
                        property: propertyList
                    },
                    testcase: testCases
                }
            }
        };

        (testResults.successes || []).forEach(testRes => {
            testCases.push({
                '@name': testRes.methodName,
                '@classname': testRes.name,
                '@time': (+testRes.time || 0) / 1000.00
            });
        });

        (testResults.failures || []).forEach(testRes => {
            testCases.push({
                '@name': testRes.methodName,
                '@classname': testRes.name,
                '@time': (+testRes.time || 0) / 1000.00,
                failure: {
                    '@message': testRes.message,
                    $text: testRes.stackTrace
                }
            });
        });

        documentEl.testSuites.testSuite['@tests'] = deployResult.numberTestsTotal;
        documentEl.testSuites.testSuite['@failures'] = deployResult.numberTestErrors;
        documentEl.testSuites.testSuite['@errors'] = 0;
        documentEl.testSuites.testSuite['@time'] = testResults.totalTime;

        propertyList.push(createProperty('outcome', deployResult.status));
        propertyList.push(createProperty('testsRan', deployResult.numberTestsTotal));
        propertyList.push(createProperty('passing', deployResult.numberTestsCompleted));
        propertyList.push(createProperty('failing', deployResult.numberTestErrors));
        propertyList.push(createProperty('skipped', 0));
        if (deployResult.numberTestsTotal > 0) {
            const passRate = 100 * (deployResult.numberTestsCompleted / deployResult.numberTestsTotal);
            const failRate = 100 - passRate;
            propertyList.push(createProperty('passRate', `${passRate.toFixed(0)}%`));
            propertyList.push(createProperty('failRate', `${failRate.toFixed(0)}%`));
        }
        propertyList.push(createProperty('hostname', connData.loginUrl));
        propertyList.push(createProperty('testRunId', deployResult.id));
        propertyList.push(createProperty('userId', deployResult.createdBy));

        return '' + create({ encoding: 'UTF-8' }, documentEl).end({ prettyPrint: true });
    };

    public getFilename = (deployResult): string => {
        return `${deployResult.id}-test-results.xml`;
    }
}
