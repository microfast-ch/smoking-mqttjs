import {connect, MqttClient, PacketCallback, StorePutCallback} from "mqtt";
import {crypto_sign, crypto_sign_keypair, KeyPair, ready} from "libsodium-wrappers";
import {Base32} from "base32-ts";
import {Packet} from "mqtt-packet";
import {MqttClientEx} from "./MqttClientEx";

export class SmokerMqttClient {
    public mqttClient : MqttClientEx;

    public claim(topicName: string) {

    }

    public async connect() : Promise<void> {
        this.mqttClient = await this.initClient();
    }

    public disconnect() : void {
        this.mqttClient.end();
        this.mqttClient = null;
    }

    private async initClient(): Promise<MqttClientEx> {
        let keyPair = await this.generateKeyPair();
        var client = connect('mqtt://127.0.0.1', {
            clientId: Base32.encode(Buffer.from(keyPair.publicKey)),
            protocolVersion: 5,
            clean: true,
            properties: {
                authenticationMethod: 'SMOKER'
            }
        }) as MqttClientEx;


        client.handleAuth = function (packet : Packet) {
            if (packet.properties.authenticationMethod == 'SMOKER') {
                const nonce = packet.properties.authenticationData;
                if (nonce) {
                    console.log("Received nonce from SMOKER. nonceLength:=" + nonce.length + " bytes")
                    const signedNonce = crypto_sign(nonce, keyPair.privateKey);
                    const authPackage = {
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

                    packet = authPackage as Packet;
                }
            }
        }

        client.on('packetreceive', function (p: Packet) {
            if (p.cmd.toString() === 'auth') {
                console.log(JSON.stringify(p));
                const packet = p as any;
                if (packet.properties.authenticationMethod == 'SMOKER') {
                    const nonce = packet.properties.authenticationData;
                    if (nonce) {
                        console.log("Received nonce from SMOKER. nonceLength:=" + nonce.length + " bytes")
                        const signedNonce = crypto_sign(nonce, keyPair.privateKey);
                        const authPackage = {
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
                        if (client) {
                            client.connected = true;
                            client._sendPacket(authPackage as Packet);
                            client.connected = false;
                        }
                    }
                }
            }
        })

        return client;
    }

    public async generateKeyPair(): Promise<KeyPair> {
        await ready;
        console.log("Generating new key-pair...")
        return crypto_sign_keypair();
    }
}
