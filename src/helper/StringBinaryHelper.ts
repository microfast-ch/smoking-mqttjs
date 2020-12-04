export class StringBinaryHelper {
    public static string2Bin(input : string) : any[] {
        const result = [];
        for (var i = 0; i < input.length; i++) {
            result.push(input.charCodeAt(i).toString(2));
        }
        return result;
    }
}
