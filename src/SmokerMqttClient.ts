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
    // TODO / cevo / candidates to outsource in config
    private _claimTopic = "access/claim";
    private _unclaimTopic = "access/unclaim";
    private _restrictedPrefix = "restricted";
    private _smokerAuthMethod = "SMOKER";

    private _mqttClient : MqttClient;
    private _keyPair: KeyPair;
    private _clientId: string;

    /**
     * Unclaim a topic
     * @param topicName the topic to be unclaimed. Can be either in smoker-format or not. If not it will be formatted.
     */
    public async unclaim(topicName: string) : Promise<Packet> {
        return new Promise(async (resolve, reject) => {
            console.log("Sending unclaim for topic:="  + topicName);
            this._mqttClient.publish(this._unclaimTopic, JSON.stringify(topicName), null, (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    /**
     * Claim a topic
     * @param topicName the topic to be claimed. Can be either in smoker-format or not. If not it will be formatted.
     */
    public async claim(topicName: string) : Promise<Packet> {
        return new Promise(async (resolve, reject) => {

            // setup restriction
            var restriction = <Restriction> {
                restrictionType: RestrictionType.Whitelist,
                topicName: this.generateRestrictedTopic(topicName),
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
            this._mqttClient.publish(this._claimTopic, JSON.stringify(claim), null, (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    /**
     * Connect to a smoker broker
     * @param keyPair optional keypair for authentication, if none is provided a new one will be generated
     * @param TODO / cevo / parameterize IClientOptions? Maybe wrap it to never allow custom clinetId's / non smoker auth?
     */
    public async connect(keyPair : KeyPair = null) : Promise<void> {
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

    private async initClient(keyPair : KeyPair = null): Promise<MqttClient> {
        this._keyPair = keyPair ?? await this.generateKeyPair();
        this._clientId = Base32.encode(Buffer.from(this._keyPair.publicKey));

        var client = <MqttClient> connect('mqtt://127.0.0.1', {
            clientId: this._clientId,
            protocolVersion: 5,
            clean: true,
            properties: {
                authenticationMethod: this._smokerAuthMethod
            }
        });

        var that = this;
        client.handleAuth = function (packet : IAuthPacket, callback : PacketCallback) {
            if (packet.properties.authenticationMethod == that._smokerAuthMethod) {
                const nonce = packet.properties.authenticationData;
                if (nonce) {
                    console.log("Received nonce from SMOKER. nonceLength:=" + nonce.length + " bytes")
                    const signedNonce = crypto_sign(nonce, that._keyPair.privateKey);
                    const authPackage = <IAuthPacket> {
                        cmd: 'auth',
                        reasonCode: 24, // 0x18 Continue authentication
                        properties: {
                            authenticationMethod: that._smokerAuthMethod,
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

    private generateRestrictedTopic(topicName : string) : string {
        if (topicName.startsWith("restricted")) {
            console.log("Guess topic ist already in correct format. topicName:=" + topicName);
            return topicName;
        }
        return this._restrictedPrefix + '/' + this._clientId + '/' + topicName;
    }

    private async generateKeyPair(): Promise<KeyPair> {
        await ready;
        console.log("Generating new key-pair...")
        return crypto_sign_keypair();
    }
}
