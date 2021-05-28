import {KeyPair} from "libsodium-wrappers";
import {toBase32} from "../lib/base32";

/**
 * Helper module to expose some handy helper functions
 */
export module SmokerHelper {
    /**
     * Function to generate the clientId which will be used to connect to the broker
     * @param keyPair the generated key pair
     */
    export function getSmokerClientId(keyPair: KeyPair): string {
        return toBase32(Buffer.from(keyPair.publicKey));
    }
}