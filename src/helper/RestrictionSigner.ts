import {Restriction} from "../domain/Restriction";
import {StringBinaryHelper} from "./StringBinaryHelper";
import {Permission} from "../domain/Permission";

export class RestrictionSigner {
    static signRestriction(restriction : Restriction, privateKey : Uint8Array) : Uint8Array {
        return null;
    }

    private static getRestricionSignaturePayload(restriction : Restriction) : Uint8Array {
        var encoder = new TextEncoder();

        var byteArrays = new Array<Uint8Array>();

        var topicNameBytes = restriction.topicName != null
            ? encoder.encode(restriction.topicName)
            : new Uint8Array(0);
        var restrictionTypeBytes = encoder.encode(restriction.restrictionType)

        // collect all byte arrays
        byteArrays.push(topicNameBytes, restrictionTypeBytes);
        for (var permission of restriction.permissions) {
            byteArrays.push(this.getPermissionSignaturePayload(permission));
        }

        return this.hash(byteArrays);
    }

    private static getPermissionSignaturePayload(permission : Permission) : Uint8Array {
        var encoder = new TextEncoder();
        var clientIdBytes = permission.clientId != null
            ? encoder.encode(permission.clientId)
            : new Uint8Array(0);

        var activityBytes = permission.activity != null
            ? encoder.encode(permission.activity)
            : new Uint8Array(0);

        var byteArrays = new Array<Uint8Array>();
        byteArrays.push(clientIdBytes);
        byteArrays.push(activityBytes);

        return this.hash(byteArrays);
    }

    private static hash(items : Array<Uint8Array>) : Uint8Array {
        var result = new Uint8Array(0);
        for (var arr of items) {
            result = new Uint8Array([ ...result, ...arr]);
        }

        // TODO / cevo / create the sha-256 hash of the concatenated array here

        return null;
    }
}
