import { datamap, dataarray } from "../extension_wrapper";
export declare class Data {
    static generate(data: Array<any> | Record<string, any>): any;
    static toJson(data: typeof datamap | typeof dataarray): any;
    private static mapObject;
    private static mapArray;
}
