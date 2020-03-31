import { expect, test } from '@salesforce/command/lib/test';
import { XUnitNet } from '../../../src/lib/converters/xunitnet';
import { create } from 'xmlbuilder2';
import { select } from 'xpath';

const connectionDetails = {
    loginUrl: 'https://test.salesforce.com'
};

const padDateTime = (val): string => {
    return ('0'.repeat(2) + val).substr(-2);
};

const getDateFormats = (dateString) => {
    const dt = new Date(dateString);
    return {
        'date': `${dt.getFullYear()}-${padDateTime(dt.getMonth() + 1)}-${padDateTime(dt.getDate())}`,
        'time': `${padDateTime(dt.getHours())}:${padDateTime(dt.getMinutes())}:${padDateTime(dt.getSeconds())}`
    };
};

describe('xunit.net converter', () => {
    test.it('getFilename should return the expected value', () => {
        const xunit = new XUnitNet();
        const deployResTest = { id: 'testId' };
        expect(xunit.getFilename(deployResTest)).to.equal('testId-test-results.xml');
    });

    test.it('convert should handle details without tests', () => {
        const xunit = new XUnitNet();
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
        const assemblies = select('//assembly', actualXml);
        expect(assemblies.length).to.equal(1);
        //Check testSuite properties
        const assembly = assemblies[0];

        expect(assembly.getAttribute('environment')).to.equal(connectionDetails.loginUrl);
        const dateVals = getDateFormats(deployResTest.startDate);
        expect(assembly.getAttribute('run-date')).to.equal(dateVals.date);
        expect(assembly.getAttribute('run-time')).to.equal(dateVals.time);
        expect(assembly.getAttribute('total')).to.equal('0');
        expect(assembly.getAttribute('passed')).to.equal('0');
        expect(assembly.getAttribute('failed')).to.equal('0');
        expect(assembly.getAttribute('errors')).to.equal('0');
        expect(assembly.getAttribute('skipped')).to.equal('0');
        expect(assembly.getAttribute('time')).to.equal('0');

        expect(select('//collection', actualXml).length, 'No collections should be included').to.equal(0);
    });

    test.it('convert should handle details with only successful tests', () => {
        const xunit = new XUnitNet();
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
        const assemblies = select('//assembly', actualXml);
        expect(assemblies.length).to.equal(1);
        //Check testSuite properties
        const assembly = assemblies[0];

        expect(assembly.getAttribute('environment')).to.equal(connectionDetails.loginUrl);
        const dateVals = getDateFormats(deployResTest.startDate);
        expect(assembly.getAttribute('run-date')).to.equal(dateVals.date);
        expect(assembly.getAttribute('run-time')).to.equal(dateVals.time);
        expect(assembly.getAttribute('total')).to.equal('2');
        expect(assembly.getAttribute('passed')).to.equal('2');
        expect(assembly.getAttribute('failed')).to.equal('0');
        expect(assembly.getAttribute('errors')).to.equal('0');
        expect(assembly.getAttribute('skipped')).to.equal('0');
        expect(assembly.getAttribute('time')).to.equal('0.5');

        const collections = select('//collection', actualXml);
        expect(collections.length).to.equal(1);
        const coll = collections[0];
        expect(coll.getAttribute('total')).to.equal('2');
        expect(coll.getAttribute('passed')).to.equal('2');
        expect(coll.getAttribute('failed')).to.equal('0');
        expect(coll.getAttribute('skipped')).to.equal('0');
        expect(coll.getAttribute('time')).to.equal('0.5');

        expect(select('//test', actualXml).length).to.equal(2);
    });

    test.it('convert should handle details with only failed tests', () => {
        const xunit = new XUnitNet();
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
        const assemblies = select('//assembly', actualXml);
        expect(assemblies.length).to.equal(1);
        //Check testSuite properties
        const assembly = assemblies[0];

        expect(assembly.getAttribute('environment')).to.equal(connectionDetails.loginUrl);
        const dateVals = getDateFormats(deployResTest.startDate);
        expect(assembly.getAttribute('run-date')).to.equal(dateVals.date);
        expect(assembly.getAttribute('run-time')).to.equal(dateVals.time);
        expect(assembly.getAttribute('total')).to.equal('2');
        expect(assembly.getAttribute('passed')).to.equal('0');
        expect(assembly.getAttribute('failed')).to.equal('2');
        expect(assembly.getAttribute('errors')).to.equal('0');
        expect(assembly.getAttribute('skipped')).to.equal('0');
        expect(assembly.getAttribute('time')).to.equal('0.5');

        const collections = select('//collection', actualXml);
        expect(collections.length).to.equal(1);
        const coll = collections[0];
        expect(coll.getAttribute('total')).to.equal('2');
        expect(coll.getAttribute('passed')).to.equal('0');
        expect(coll.getAttribute('failed')).to.equal('2');
        expect(coll.getAttribute('skipped')).to.equal('0');
        expect(coll.getAttribute('time')).to.equal('0.5');

        expect(select('//test', actualXml).length).to.equal(2);
        expect(select('//message', actualXml).length).to.equal(2);
        expect(select('//stack-trace', actualXml).length).to.equal(2);
    });

    test.it('convert should handle multiple test classes', () => {
        const xunit = new XUnitNet();
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
                            name: 'TestClass1',
                            time: '500.0'
                        },
                        {
                            id: '01p000000000000001',
                            methodName: 'test2',
                            name: 'TestClass2',
                            time: '500.0'
                        }
                    ],
                    totalTime: '1000.0'
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
        const assemblies = select('//assembly', actualXml);
        expect(assemblies.length).to.equal(1);
        //Check testSuite properties
        const assembly = assemblies[0];

        expect(assembly.getAttribute('environment')).to.equal(connectionDetails.loginUrl);
        const dateVals = getDateFormats(deployResTest.startDate);
        expect(assembly.getAttribute('run-date')).to.equal(dateVals.date);
        expect(assembly.getAttribute('run-time')).to.equal(dateVals.time);
        expect(assembly.getAttribute('total')).to.equal('2');
        expect(assembly.getAttribute('passed')).to.equal('2');
        expect(assembly.getAttribute('failed')).to.equal('0');
        expect(assembly.getAttribute('errors')).to.equal('0');
        expect(assembly.getAttribute('skipped')).to.equal('0');
        expect(assembly.getAttribute('time')).to.equal('1');

        const collections = select('//collection', actualXml);
        expect(collections.length, 'there should be 1 collection per test class').to.equal(2);
        collections.forEach(coll => {
            expect(coll.getAttribute('total')).to.equal('1');
            expect(coll.getAttribute('passed')).to.equal('1');
            expect(coll.getAttribute('failed')).to.equal('0');
            expect(coll.getAttribute('skipped')).to.equal('0');
            expect(coll.getAttribute('time')).to.equal('0.5');
            expect(select(`//test[@type='${coll.getAttribute('name')}']`, coll).length).to.equal(1);
        });
    });
});