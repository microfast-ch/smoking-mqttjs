import { connect, MqttClient, PacketCallback, StorePutCallback } from 'mqtt';
import { Packet, IConnackPacket } from 'mqtt-packet';
import { crypto_sign_keypair, ready, crypto_sign } from 'libsodium-wrappers';

export declare class MqttClientEx extends MqttClient {
        /**
     * _sendPacket - send or queue a packet
     * @param {Packet} packet - packet options
     * @param {Function} [cb] - callback fired on unsuback
     * @param {Function} cb - callback when the packet is sent
     * @param {Function} cbStorePut - called when message is put into outgoingStore
     * @api private
     */
    public _sendPacket(packet: Packet, cb?: PacketCallback, cbStorePut?: StorePutCallback): void
}

(async () => {
    await ready;
    let initialKeypair = crypto_sign_keypair();
    const clientId = base32.encode(Buffer.from(initialKeypair.publicKey).toString());

    var client = connect('mqtt://127.0.0.1', {
        clientId: clientId,
        protocolVersion: 5,
        clean: true,
        properties: {
            authenticationMethod: 'SMOKER'
        }
    });
    client.on('packetreceive', function (p: Packet) {
        if (p.cmd.toString() === 'auth') {
            console.log(JSON.stringify(p));
            const packet = p as any;
            if (packet.properties.authenticationMethod == 'SMOKER') {
                const nonce = packet.properties.authenticationData;
                if (nonce) {
                    const signedNonce = crypto_sign(nonce, initialKeypair.privateKey);
                    const authPackage = {
                        cmd: 'auth',
                        reasonCode: 24, // MQTT 5.0 code
                        properties: { // properties MQTT 5.0
                            authenticationMethod: 'SMOKER',
                            authenticationData: Buffer.from([
                                ...signedNonce
                            ]),
                            reasonString: 'continue',
                            userProperties: {
                                'test': 'test'
                            }
                        }
                    };
                    let clientEx = client as MqttClientEx
                    if (clientEx) {
                        client.connected = true;
                        clientEx._sendPacket(authPackage as Packet);
                        client.connected = false;
                    }
                }
            }
        }
    })

    client.on('connect', function () {
        console.log('HELLO SMOKER');
        client.subscribe('presence', function (err) {
            if (!err) {
                client.publish('presence', 'Hello mqtt');
            }
        })
    })

    client.on('message', function (topic, message) {
        // message is Buffer
        console.log(message.toString());
        client.end();
    })
})();
