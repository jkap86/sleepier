import { Metrics } from "../metrics";
import { Probes } from "../probes";
export declare class NoopMetrics extends Metrics {
    #private;
    setGauge(_key: string, _value: number, _tags?: {
        [key: string]: string | number | boolean;
    }): this;
    addDistributionValue(_key: string, _value: number, _tags?: {
        [key: string]: string | number | boolean;
    }): this;
    incrementCounter(_key: string, _value: number, _tags?: {
        [key: string]: string | number | boolean;
    }): this;
    probes(): Probes;
}
