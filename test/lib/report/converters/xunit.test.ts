import { expect, test } from '@salesforce/command/lib/test';
import { XUnit } from '../../../../src/lib/report/converters/xunit';
import { create } from 'xmlbuilder2';
import { select, select1 } from 'xpath';

const connectionDetails = {
    loginUrl: 'https://test.salesforce.com'
};

describe('xunit converter', () => {
    test.it('getFilename should return the expected value', () => {
        const xunit = new XUnit();
        const deployResTest = { id: 'testId' };
        expect(xunit.getFilename(deployResTest)).to.equal('testId-test-results.xml');
    });

    test.it('convert should handle details without tests', () => {
        const xunit = new XUnit();
        const deployResTest = {
            createdBy: '005000000000000000',
            details: {
                runTestResult: {}
            },
            id: 'testId',
            numberTestErrors: 0,
            numberTestsCompleted: 0,
            numberTestsTotal: 0,
            startDate: '2020-03-23T13:48:31.624Z',
            status: 'Succeeded'
        };

        const actualXmlString = xunit.convert(deployResTest, connectionDetails);

        expect(actualXmlString).to.not.be.empty;

        const actualXml = create(actualXmlString).node;
        const testSuites = select('//testSuite', actualXml);
        expect(testSuites.length).to.equal(1);
        const testSuite = testSuites[0];
        //Check testSuite properties
        expect(testSuite.getAttribute('hostname')).to.equal(connectionDetails.loginUrl);
        expect(testSuite.getAttribute('tests')).to.equal('0');
        expect(testSuite.getAttribute('failures')).to.equal('0');
        expect(testSuite.getAttribute('errors')).to.equal('0');

        expect(select1('//property[@name=\'outcome\']', actualXml).getAttribute('value')).to.equal(deployResTest.status);
        expect(select1('//property[@name=\'testsRan\']', actualXml).getAttribute('value')).to.equal('0');
        expect(select1('//property[@name=\'passing\']', actualXml).getAttribute('value')).to.equal('0');
        expect(select1('//property[@name=\'failing\']', actualXml).getAttribute('value')).to.equal('0');
        expect(select1('//property[@name=\'skipped\']', actualXml).getAttribute('value')).to.equal('0');
        expect(select('//property[@name=\'passRate\']', actualXml).length).to.equal(0);
        expect(select('//property[@name=\'failRate\']', actualXml).length).to.equal(0);
        expect(select1('//property[@name=\'hostname\']', actualXml).getAttribute('value')).to.equal(connectionDetails.loginUrl);
        expect(select1('//property[@name=\'userId\']', actualXml).getAttribute('value')).to.equal(deployResTest.createdBy);

        expect(select('//testcase', actualXml).length, 'No testcases should be included').to.equal(0);
    });

    test.it('convert should handle details with only successful tests', () => {
        const xunit = new XUnit();
        const deployResTest = {
            createdBy: '005000000000000000',
            details: {
                runTestResult: {
                    failures: [],
                    numFailures: '0',
                    numTestsRun: '2',
                    successes: [
                        {
                            id: '01p000000000000000',
                            methodName: 'test1',
                            name: 'TestClass'
                        },
                        {
                            id: '01p000000000000001',
                            methodName: 'test2',
                            name: 'TestClass',
                            time: '500.0'
                        }
                    ],
                    totalTime: '500.0'
                }
            },
            id: 'testId',
            numberTestErrors: 0,
            numberTestsCompleted: 2,
            numberTestsTotal: 2,
            startDate: '2020-03-23T13:48:31.624Z',
            status: 'Succeeded'
        };

        const actualXmlString = xunit.convert(deployResTest, connectionDetails);

        expect(actualXmlString).to.not.be.empty;

        const actualXml = create(actualXmlString).node;
        const testSuites = select('//testSuite', actualXml);
        expect(testSuites.length).to.equal(1);
        const testSuite = testSuites[0];
        //Check testSuite properties
        expect(testSuite.getAttribute('hostname')).to.equal(connectionDetails.loginUrl);
        expect(testSuite.getAttribute('tests')).to.equal('2');
        expect(testSuite.getAttribute('failures')).to.equal('0');
        expect(testSuite.getAttribute('errors')).to.equal('0');

        expect(select1('//property[@name=\'outcome\']', actualXml).getAttribute('value')).to.equal(deployResTest.status);
        expect(select1('//property[@name=\'testsRan\']', actualXml).getAttribute('value')).to.equal('2');
        expect(select1('//property[@name=\'passing\']', actualXml).getAttribute('value')).to.equal('2');
        expect(select1('//property[@name=\'failing\']', actualXml).getAttribute('value')).to.equal('0');
        expect(select1('//property[@name=\'skipped\']', actualXml).getAttribute('value')).to.equal('0');
        expect(select1('//property[@name=\'passRate\']', actualXml).getAttribute('value')).to.equal('100%');
        expect(select1('//property[@name=\'failRate\']', actualXml).getAttribute('value')).to.equal('0%');
        expect(select1('//property[@name=\'hostname\']', actualXml).getAttribute('value')).to.equal(connectionDetails.loginUrl);
        expect(select1('//property[@name=\'userId\']', actualXml).getAttribute('value')).to.equal(deployResTest.createdBy);

        expect(select('//testcase', actualXml).length).to.equal(2);
    });

    test.it('convert should handle details with only failed tests', () => {
        const xunit = new XUnit();
        const deployResTest = {
            createdBy: '005000000000000000',
            details: {
                runTestResult: {
                    failures: [
                        {
                            id: '01p000000000000000',
                            message: 'Error Message 1',
                            methodName: 'test1',
                            stackTrace: 'Test stack trace with one line',
                            name: 'TestClass'
                        },
                        {
                            id: '01p000000000000001',
                            message: 'Error Message 2',
                            methodName: 'test2',
                            name: 'TestClass',
                            stackTrace: `Test stack trace
                            with multiple lines`,
                            time: '500.0'
                        }
                    ],
                    numFailures: '2',
                    numTestsRun: '2',
                    successes: [],
                    totalTime: '500.0'
                }
            },
            id: 'testId',
            numberTestErrors: 2,
            numberTestsCompleted: 0,
            numberTestsTotal: 2,
            startDate: '2020-03-23T13:48:31.624Z',
            status: 'Failed'
        };

        const actualXmlString = xunit.convert(deployResTest, connectionDetails);

        expect(actualXmlString).to.not.be.empty;

        const actualXml = create(actualXmlString).node;
        const testSuites = select('//testSuite', actualXml);
        expect(testSuites.length).to.equal(1);
        const testSuite = testSuites[0];
        //Check testSuite properties
        expect(testSuite.getAttribute('hostname')).to.equal(connectionDetails.loginUrl);
        expect(testSuite.getAttribute('tests')).to.equal('2');
        expect(testSuite.getAttribute('failures')).to.equal('2');
        expect(testSuite.getAttribute('errors')).to.equal('0');

        expect(select1('//property[@name=\'outcome\']', actualXml).getAttribute('value')).to.equal(deployResTest.status);
        expect(select1('//property[@name=\'testsRan\']', actualXml).getAttribute('value')).to.equal('2');
        expect(select1('//property[@name=\'passing\']', actualXml).getAttribute('value')).to.equal('0');
        expect(select1('//property[@name=\'failing\']', actualXml).getAttribute('value')).to.equal('2');
        expect(select1('//property[@name=\'skipped\']', actualXml).getAttribute('value')).to.equal('0');
        expect(select1('//property[@name=\'passRate\']', actualXml).getAttribute('value')).to.equal('0%');
        expect(select1('//property[@name=\'failRate\']', actualXml).getAttribute('value')).to.equal('100%');
        expect(select1('//property[@name=\'hostname\']', actualXml).getAttribute('value')).to.equal(connectionDetails.loginUrl);
        expect(select1('//property[@name=\'userId\']', actualXml).getAttribute('value')).to.equal(deployResTest.createdBy);

        expect(select('//testcase', actualXml).length).to.equal(2);
    });
});