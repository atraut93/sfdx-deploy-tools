import { XUnit } from './converters/xunit';

export interface TestResultConverter {
    convert(deployResult, connData): string;
    getFilename(deployResult): string;
}

export default {
    xunit: new XUnit()
};
