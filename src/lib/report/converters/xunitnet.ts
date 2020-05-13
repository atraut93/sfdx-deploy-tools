import { create } from 'xmlbuilder2';
import { TestResultConverter } from '../converters';

const groupByClass = testResults => {
    const testsByClass = new Map();
    (testResults.successes || []).forEach(testRes => {
        if (!testsByClass.has(testRes.name)) {
            testsByClass.set(testRes.name, []);
        }
        testsByClass.get(testRes.name).push(testRes);
    });

    (testResults.failures || []).forEach(testRes => {
        if (!testsByClass.has(testRes.name)) {
            testsByClass.set(testRes.name, []);
        }
        testsByClass.get(testRes.name).push(testRes);
    });
    return testsByClass;
};

const padLeading = (value, num: number, char: string): string => {
    const fullString = char.repeat(num) + value;
    return fullString.substr(num * -1);
};

export class XUnitNet implements TestResultConverter {
    public convert = (deployResult, connData): string => {
        const testResults = deployResult.details.runTestResult;
        const testsByClass = groupByClass(testResults);
        const collections = [];
        const startDate = new Date(deployResult.startDate);
        const documentEl = {
            assemblies: {
                assembly: {
                    '@name': 'force.apex',
                    '@environment': connData.loginUrl,
                    '@run-date': `${padLeading(startDate.getFullYear(), 4, '0')}-${padLeading(startDate.getMonth() + 1, 2, '0')}-${padLeading(startDate.getDate(), 2, '0')}`,
                    '@run-time': `${padLeading(startDate.getHours(), 2, '0')}:${padLeading(startDate.getMinutes(), 2, '0')}:${padLeading(startDate.getSeconds(), 2, '0')}`,
                    '@total': deployResult.numberTestsTotal,
                    '@passed': deployResult.numberTestsCompleted,
                    '@failed': deployResult.numberTestErrors,
                    '@errors': 0,
                    '@skipped': 0,
                    '@time': (+testResults.totalTime || 0) / 1000.00,
                    collection: collections
                }
            }
        };

        testsByClass.forEach((tests, className) => {
            const collection = {
                '@name': className,
                '@total': tests.length,
                '@passed': 0,
                '@failed': 0,
                '@skipped': 0,
                test: []
            };
            let totalTime = 0.0;
            tests.forEach(value => {
                const testTime = (+value.time || 0) / 1000.00;
                totalTime += testTime;
                const status = value.message ? 'Fail' : 'Pass';

                const testVal = {
                    '@name': value.methodName,
                    '@type': className,
                    '@method': value.methodName,
                    '@time': testTime,
                    '@result': status
                };

                if (status === 'Fail') {
                    collection['@failed']++;
                    testVal['failure'] = {
                        message: {
                            $text: value.message
                        },
                        'stack-trace': {
                            $text: value.stackTrace
                        }
                    };
                } else {
                    collection['@passed']++;
                }

                collection.test.push(testVal);
            });

            collection['@time'] = +(totalTime.toFixed(3));
            collections.push(collection);
        });

        return '' + create({ encoding: 'UTF-8' }, documentEl).end({ prettyPrint: true });
    }

    public getFilename = (deployResult): string => {
        return `${deployResult.id}-test-results.xml`;
    }
}
