import { connect, MqttClient, PacketCallback } from "mqtt";
import { crypto_sign, crypto_sign_keypair, KeyPair, ready } from "libsodium-wrappers";
import { Base32 } from "base32-ts";
import { IAuthPacket } from "mqtt-packet";

export class SmokerMqttClient {
    public mqttClient : MqttClient;

    public claim(topicName: string) {

    }

    public async connect() : Promise<void> {
        this.mqttClient = await this.initClient();
    }

    public disconnect() : void {
        this.mqttClient.end();
        this.mqttClient = null;
    }

    private async initClient(): Promise<MqttClient> {
        let keyPair = await this.generateKeyPair();
        var client = <MqttClient> connect('mqtt://127.0.0.1', {
            clientId: Base32.encode(Buffer.from(keyPair.publicKey)),
            protocolVersion: 5,
            clean: true,
            properties: {
                authenticationMethod: 'SMOKER'
            }
        });


        client.handleAuth = function (packet : IAuthPacket, callback : PacketCallback) {
            if (packet.properties.authenticationMethod == 'SMOKER') {
                const nonce = packet.properties.authenticationData;
                if (nonce) {
                    console.log("Received nonce from SMOKER. nonceLength:=" + nonce.length + " bytes")
                    const signedNonce = crypto_sign(nonce, keyPair.privateKey);
                    const authPackage = <IAuthPacket> {
                        cmd: 'auth',
                        reasonCode: 24,
                        properties: {
                            authenticationMethod: 'SMOKER',
                            authenticationData: Buffer.from([
                                ...signedNonce
                            ]),
                            reasonString: 'continue'
                        }
                    };

                    callback(null, authPackage);
                }
            }
        }
        return client;
    }

    public async generateKeyPair(): Promise<KeyPair> {
        await ready;
        console.log("Generating new key-pair...")
        return crypto_sign_keypair();
    }
}
