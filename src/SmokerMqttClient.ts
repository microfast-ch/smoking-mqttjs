import {connect, MqttClient, Packet, PacketCallback} from "mqtt";
import {crypto_sign, crypto_sign_keypair, KeyPair, ready} from "libsodium-wrappers";
import {IAuthPacket} from "mqtt-packet";
import {Claim} from "./domain/Claim";
import {Restriction} from "./domain/Restriction";
import {RestrictionType} from "./domain/RestrictionType";
import {Permission} from "./domain/Permission";
import {MqttActivityType} from "./domain/MqttActivityType";
import {ISmokerMqttClient} from "./ISmokerMqttClient";
import {toBase32} from "./lib/base32";
import {fromByteArray as toBase64} from "./lib/base64/index"
import {stableStringify} from "./lib/json-stable-stringify";

export class SmokerMqttClient implements ISmokerMqttClient {
    // TODO / cevo / candidates to outsource in config
    private _claimTopic = "access/claim";
    private _unclaimTopic = "access/unclaim";
    private _restrictedPrefix = "restricted";
    private _smokerAuthMethod = "SMOKER";

    private _mqttClient: MqttClient;
    private _keyPair: KeyPair;
    private _clientId: string;

    /** @inheritDoc */
    public async unclaim(topicName: string): Promise<Packet> {
        return new Promise(async (resolve, reject) => {
            console.log("Sending unclaim for topic:=" + topicName);
            this._mqttClient.publish(this._unclaimTopic, JSON.stringify(topicName), null, (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    /** @inheritDoc */
    public async claim(topicName: string): Promise<Packet> {
        return new Promise(async (resolve, reject) => {

            // setup restriction
            var restriction = <Restriction>{
                restrictionType: RestrictionType.Whitelist,
                topicName: this.generateRestrictedTopic(topicName),
                permissions: [
                    <Permission>{
                        clientId: "*",
                        activity: MqttActivityType.Subscribe
                    }
                ]
            }

            await ready;
            var claim = <Claim>{
                restriction: restriction,
                signature: toBase64(crypto_sign(stableStringify(restriction, null), this._keyPair.privateKey))
            }

            console.log("Sending claim:=" + JSON.stringify(claim));
            this._mqttClient.publish(this._claimTopic, JSON.stringify(claim), null, (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    /** @inheritDoc */
    public async connect(keyPair: KeyPair = null): Promise<void> {
        this._mqttClient = await this.initClient();
    }

    /** @inheritDoc */
    public disconnect(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            this._mqttClient.end(null, null, () => {
                resolve()
            })
            this._mqttClient = null;
        })
    }

    private async initClient(keyPair: KeyPair = null): Promise<MqttClient> {
        this._keyPair = keyPair ?? await this.generateKeyPair();
        this._clientId = toBase32(Buffer.from(this._keyPair.publicKey));

        var client = <MqttClient>connect('mqtt://127.0.0.1', {
            clientId: this._clientId,
            protocolVersion: 5,
            clean: true,
            properties: {
                authenticationMethod: this._smokerAuthMethod
            }
        });

        var that = this;
        client.handleAuth = function (packet: IAuthPacket, callback: PacketCallback) {
            if (packet.properties.authenticationMethod == that._smokerAuthMethod) {
                const nonce = packet.properties.authenticationData;
                if (nonce) {
                    console.log("Received nonce from SMOKER. nonceLength:=" + nonce.length + " bytes")
                    const signedNonce = crypto_sign(nonce, that._keyPair.privateKey);
                    const authPackage = <IAuthPacket>{
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

    private generateRestrictedTopic(topicName: string): string {
        if (topicName.startsWith(this._restrictedPrefix)) {
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
