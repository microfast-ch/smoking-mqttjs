/* eslint-disable max-statements */

// RFC4648 alphabet
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes an ArrayBuffer in base32 RFC4648
 *
 * @param buffer Buffer to encode
 * @param variant Base32 encoding format
 * @returns The base32 encoded ArrayBuffer
 */
export function toBase32(buffer: ArrayBuffer): string {
    const length = buffer.byteLength
    const array = new Uint8Array(buffer);

    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < length; i++) {
        value = (value << 8) | array[i];
        bits += 8;

        while (bits >= 5) {
            output += alphabet[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }

    if (bits > 0) {
        output += alphabet[(value << (5 - bits)) & 31]
    }

    while (output.length % 8 !== 0) {
        output += '=';
    }

    return output;
}

/**
 * Decodes a base32 RFC4648 encoded string
 *
 * @param input The base32 encoded string to decode
 * @param variant Base32 encoding format
 * @returns The decoded string as an ArrayBuffer
 */
export function fromBase32(input: string): ArrayBuffer {
    const cleanedInput = input.toUpperCase().replace(/=+$/, '');
    const length = cleanedInput.length;
    const output = new Uint8Array(((length * 5) / 8) | 0);

    let bits = 0;
    let value = 0;
    let index = 0;

    for (let i = 0; i < length; i++) {
        value = (value << 5) | readChar(alphabet, cleanedInput[i]);
        bits += 5;

        if (bits >= 8) {
            output[index++] = (value >>> (bits - 8)) & 255;
            bits -= 8;
        }
    }

    return output.buffer;
}

/**
 * Finds a char index in an alphabet
 *
 * @param alphabet The alphbet
 * @param char The char to find
 * @returns The char index in the alphabet
 */
function readChar(alphabet: string, char: string): number {
    const idx = alphabet.indexOf(char);

    if (idx === -1) {
        throw new Error(`Invalid character found: ${char}`);
    }

    return idx;
}
