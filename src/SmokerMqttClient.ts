import {connect, MqttClient, PacketCallback} from "mqtt";
import {crypto_sign, crypto_sign_keypair, KeyPair, ready} from "libsodium-wrappers";
import {Base32} from "base32-ts";
import { encode as Base64 } from "base64-ts";
import {IAuthPacket} from "mqtt-packet";
import {Claim} from "./domain/Claim";
import {Restriction} from "./domain/Restriction";
import {RestrictionType} from "./domain/RestrictionType";
import {Permission} from "./domain/Permission";
import {MqttActivityType} from "./domain/MqttActivityType";
import {RestrictionSigner} from "./helper/RestrictionSigner";

export class SmokerMqttClient {
    public mqttClient : MqttClient;
    public keyPair: KeyPair;
    public clientId: string;

    public claim(topicName: string) {

        // setup restriction
        var restriction = <Restriction> {
            restrictionType: RestrictionType.Whitelist,
            topicName: 'restricted/' + this.clientId + '/' + topicName,
            permissions: [
                <Permission> {
                    clientId: "*",
                    activity: MqttActivityType.Subscribe
                }
            ]
        }

        // wrap restriction and its signature in a claim
        var claim = <Claim> {
            restriction: restriction,
            signature : Base64(RestrictionSigner.signRestriction(restriction, this.keyPair.privateKey))
        }

        // submit claim to smoker
        console.log("Sending claim:=" + JSON.stringify(claim));
        this.mqttClient.publish("access/claim", JSON.stringify(claim));
    }

    public async connect() : Promise<void> {
        this.mqttClient = await this.initClient();
    }

    public disconnect() : void {
        this.mqttClient.end();
        this.mqttClient = null;
    }

    private async initClient(): Promise<MqttClient> {
        this.keyPair = await this.generateKeyPair();
        this.clientId = Base32.encode(Buffer.from(this.keyPair.publicKey));

        var client = <MqttClient> connect('mqtt://127.0.0.1', {
            clientId: this.clientId,
            protocolVersion: 5,
            clean: true,
            properties: {
                authenticationMethod: 'SMOKER'
            }
        });


        var that = this;
        client.handleAuth = function (packet : IAuthPacket, callback : PacketCallback) {
            if (packet.properties.authenticationMethod == 'SMOKER') {
                const nonce = packet.properties.authenticationData;
                if (nonce) {
                    console.log("Received nonce from SMOKER. nonceLength:=" + nonce.length + " bytes")
                    const signedNonce = crypto_sign(nonce, that.keyPair.privateKey);
                    const authPackage = <IAuthPacket> {
                        cmd: 'auth',
                        reasonCode: 24, // 0x18 Continue authentication
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
