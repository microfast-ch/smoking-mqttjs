import {connect, Packet, MqttClient, PacketCallback} from "mqtt";
import {crypto_sign, crypto_sign_keypair, KeyPair, ready} from "libsodium-wrappers";
import {Base32} from "base32-ts";
import { encode as Base64 } from "base64-ts";
import {IAuthPacket} from "mqtt-packet";
import {Claim} from "./domain/Claim";
import {Restriction} from "./domain/Restriction";
import {RestrictionType} from "./domain/RestrictionType";
import {Permission} from "./domain/Permission";
import {MqttActivityType} from "./domain/MqttActivityType";

// TODO / cevo / maybe copy this code to avoid depedency
var stringify = require('json-stable-stringify');

export class SmokerMqttClient {
    private _mqttClient : MqttClient;
    private _keyPair: KeyPair;
    private _clientId: string;

    public async claim(topicName: string) : Promise<Packet> {
        return new Promise(async (resolve, reject) => {

            // setup restriction
            var restriction = <Restriction> {
                restrictionType: RestrictionType.Whitelist,
                topicName: 'restricted/' + this._clientId + '/' + topicName,
                permissions: [
                    <Permission> {
                        clientId: "*",
                        activity: MqttActivityType.Subscribe
                    }
                ]
            }

            await ready;
            var claim = <Claim> {
                restriction: restriction,
                signature : Base64(crypto_sign(stringify(restriction), this._keyPair.privateKey))
            }

            console.log("Sending claim:=" + JSON.stringify(claim));
            this._mqttClient.publish("access/claim", JSON.stringify(claim), null, (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    public async connect() : Promise<void> {
        this._mqttClient = await this.initClient();
    }

    public disconnect() : Promise<void> {
        return new Promise(async (resolve, reject) => {
            this._mqttClient.end( null, null,() => {
                resolve()
            })
            this._mqttClient = null;
        })
    }

    private async initClient(): Promise<MqttClient> {
        this._keyPair = await this.generateKeyPair();
        this._clientId = Base32.encode(Buffer.from(this._keyPair.publicKey));

        var client = <MqttClient> connect('mqtt://127.0.0.1', {
            clientId: this._clientId,
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
                    const signedNonce = crypto_sign(nonce, that._keyPair.privateKey);
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
