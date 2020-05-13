import { XUnit } from './converters/xunit';
import { XUnitNet } from './converters/xunitnet';

export interface TestResultConverter {
    convert(deployResult, connData): string;
    getFilename(deployResult): string;
}

export default {
    xunit: new XUnit(),
    xunitnet: new XUnitNet()
};
