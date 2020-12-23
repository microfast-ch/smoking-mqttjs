import {
    connect,
    IClientPublishOptions,
    IClientSubscribeOptions,
    ISubscriptionGrant,
    MqttClient,
    OnMessageCallback,
    Packet,
    PacketCallback
} from "mqtt";
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
import {ISmokerMqttClientOptions} from "./SmokerMqttClientOptions";

export class SmokerMqttClient implements ISmokerMqttClient {
    private _mqttClient: MqttClient;
    private _keyPair: KeyPair;
    private _clientId: string;

    constructor(private _opts: ISmokerMqttClientOptions) {
        // empty yet
    }

    /** @inheritDoc */
    public async unclaim(topic: string): Promise<Packet> {
        let smokerTopic = this.smokerizeTopic(topic);
        return new Promise(async (resolve, reject) => {
            console.debug("Sending unclaim for topic:=" + smokerTopic);
            this._mqttClient.publish(this._opts.unclaimTopic, smokerTopic, <IClientPublishOptions>{qos: 1}, (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    /** @inheritDoc */
    public async claim(topic: string): Promise<Packet> {
        return new Promise(async (resolve, reject) => {

            // setup restriction
            var restriction = <Restriction>{
                restrictionType: RestrictionType.Whitelist,
                topicName: this.smokerizeTopic(topic),
                permissions: [
                    <Permission>{
                        clientId: "*",
                        activity: MqttActivityType.Subscribe
                    }
                ]
            }

            await ready;
            let claim = <Claim>{
                restriction: restriction,
                signature: toBase64(crypto_sign(stableStringify(restriction, null), this._keyPair.privateKey))
            }

            console.debug("Sending claim:=" + JSON.stringify(claim));
            this._mqttClient.publish(this._opts.claimTopic, JSON.stringify(claim), <IClientPublishOptions>{qos: 1}, (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    /** @inheritDoc */
    publish(topic: string, message: string | Buffer, opts?: IClientPublishOptions): Promise<Packet> {
        return new Promise((resolve, reject) => {
            this._mqttClient.publish(topic, message, opts, (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    /** @inheritDoc */
    publishClaimed(topic: string, message: string | Buffer, opts?: IClientPublishOptions): Promise<Packet> {
        let smokerTopic = this.smokerizeTopic(topic);
        return this.publish(smokerTopic, message, opts);
    }

    /** @inheritDoc */
    subscribe(topic: string | string[], opts?: IClientSubscribeOptions): Promise<ISubscriptionGrant[]> {
        return new Promise((resolve, reject) => {
            this._mqttClient.subscribe(topic, opts, (err, result) => {
                if (err) reject(err)
                else resolve(result)
            })
        })
    }

    /** @inheritDoc */
    subscribeClaimed(topic: string, opts?: IClientSubscribeOptions): Promise<ISubscriptionGrant[]> {
        let smokerTopic = this.smokerizeTopic(topic);
        return this.subscribe(smokerTopic, opts);
    }

    /** @inheritDoc */
    public async connect(keyPair?: KeyPair): Promise<void> {
        this._mqttClient = await this.initClient(keyPair);
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

    on(event: "message", cb: OnMessageCallback): ISmokerMqttClient {
        this._mqttClient.on(event, cb);
        return this;
    }

    private async initClient(keyPair?: KeyPair): Promise<MqttClient> {
        this._keyPair = keyPair ?? await this.generateKeyPair();
        this._clientId = toBase32(Buffer.from(this._keyPair.publicKey));

        var client = <MqttClient>connect(this._opts.brokerUrl, {
            clientId: this._clientId,
            protocolVersion: 5,
            clean: true,
            properties: {
                authenticationMethod: this._opts.smokerAuthMethod
            }
        });

        var that = this;
        client.handleAuth = function (packet: IAuthPacket, callback: PacketCallback) {
            if (packet.properties.authenticationMethod == that._opts.smokerAuthMethod) {
                const nonce = packet.properties.authenticationData;
                if (nonce) {
                    console.debug("Received nonce from SMOKER. nonceLength:=" + nonce.length + " bytes")
                    const signedNonce = crypto_sign(nonce, that._keyPair.privateKey);
                    const authPackage = <IAuthPacket>{
                        cmd: 'auth',
                        reasonCode: 24, // 0x18 Continue authentication
                        properties: {
                            authenticationMethod: that._opts.smokerAuthMethod,
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

    private smokerizeTopic(topic: string): string {
        if (topic.startsWith(this._opts.restrictedPrefix)) {
            console.debug("Guess topic ist already in correct format. topic:=" + topic);
            return topic;
        }
        return this._opts.restrictedPrefix + '/' + this._clientId + '/' + topic;
    }

    private async generateKeyPair(): Promise<KeyPair> {
        await ready;
        console.debug("Generating new key-pair...")
        return crypto_sign_keypair();
    }
}
