import {
    connect, IClientOptions,
    IClientPublishOptions,
    IClientSubscribeOptions,
    ISubscriptionGrant,
    MqttClient, OnConnectCallback,
    OnMessageCallback,
    Packet,
    PacketCallback
} from "mqtt";
import {crypto_sign, crypto_sign_keypair, KeyPair, ready as libsodiumReady} from "libsodium-wrappers";
import {IAuthPacket} from "mqtt-packet";
import {Claim, Restriction} from "./domain";
import {ISmokerMqttClient} from "./ISmokerMqttClient";
import {fromByteArray as toBase64} from "./lib/base64"
import {stableStringify} from "./lib/json-stable-stringify";
import {ISmokerMqttClientOptions} from "./SmokerMqttClientOptions";
import {OnErrorCallback, OnPacketCallback} from "mqtt/types/lib/client";
import {SmokerHelper} from "./helpers";

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
    public async claim(restriction: Restriction): Promise<Packet> {
        return new Promise(async (resolve, reject) => {
            const claim = await this.createClaim(restriction);

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
    publishClaimed(topic: string, message: string | Buffer, ownerClientId?: string, opts?: IClientPublishOptions): Promise<Packet> {
        let smokerTopic = this.smokerizeTopic(topic, ownerClientId);
        return this.publish(smokerTopic, message, opts);
    }

    /** @inheritDoc */
    subscribe(topic: string | string[], opts?: IClientSubscribeOptions): Promise<ISubscriptionGrant[]> {
        return new Promise((resolve, reject) => {
            this._mqttClient.subscribe(topic, opts, (err, result) => {
                if (err) {
                    reject(err)
                } else if (result && result.length > 0 && result[0].qos > 2) {
                    // TODO / cevo / we should actually support several subscriptions at a time and validate the whole Array of ISubscriptionResult - a result of a SubscriptionResult would be nice
                    // As we only support subscriptions of one topic per call yet, we expect that only one ISubscriptionGrant is returned
                    // If the subscription failed on broker side (i.e. not authorized) the error code is written to qos field by MQTT.js (weird thing...)
                    reject(new Error('Error subscribing to topic. ErrorCode:=\' + result[0].qos + ", Topic:=" + topic'))
                } else {
                    resolve(result)
                }
            })
        })
    }

    /** @inheritDoc */
    subscribeClaimed(topic: string, ownerClientId?: string, opts?: IClientSubscribeOptions): Promise<ISubscriptionGrant[]> {
        let smokerTopic = this.smokerizeTopic(topic, ownerClientId);
        return this.subscribe(smokerTopic, opts);
    }

    /** @inheritDoc */
    unsubscribe (topic: string | string[], opts?: Object): Promise<Packet> {
        return new Promise((resolve, reject) => {
            this._mqttClient.unsubscribe(topic, opts, (error, packet) => {
                if (error) reject(error)
                else resolve(packet)
            });
        })
    }

    /** @inheritDoc */
    public async connect(keyPair?: KeyPair): Promise<string> {
        return new Promise(async (resolve, reject) => {
            let clientInit = this.initClient(keyPair);
            clientInit
                .then(() => { resolve(this._clientId); })
                .catch((err) => { reject(err); })
            this._mqttClient = await clientInit;
        })
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

    /** @inheritDoc */
    public on(event: "connect"
                | "message"
                | "packetsend"
                | "packetreceive"
                | "error",
              cb: OnConnectCallback
                  | OnMessageCallback
                  | OnPacketCallback
                  | OnErrorCallback): ISmokerMqttClient {
        this._mqttClient.on(event, cb);
        return this;
    }

    /** @inheritDoc */
    public createClaim(restriction: Restriction): Promise<Claim> {
        return new Promise(async (resolve) => {
            // make sure topic is in correct format
            restriction.topicName = this.smokerizeTopic(restriction.topicName);

            await libsodiumReady;
            let claim = <Claim>{
                restriction: restriction,
                signature: toBase64(crypto_sign(stableStringify(restriction, null), this._keyPair.privateKey))
            }

            resolve(claim);
        })
    }

    private async initClient(keyPair?: KeyPair): Promise<MqttClient> {
        this._keyPair = keyPair ?? await this.generateKeyPair();
        this._clientId = SmokerHelper.getSmokerClientId(this._keyPair);
        let clientOpts = this.getBaseClientOptions(this._clientId, this._opts);

        const client = <MqttClient>connect(this._opts.brokerUrl, clientOpts);
        const that = this;
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

    /**
     * Brings a topic to the smoker topic format. If the topic already starts with the configured restricted area prefix
     * it is guessd that the topci is already correct. Otherwise the topic is formatted correctly.
     * @param topic the topic to be formatted
     * @param ownerClientId the owner's client ID of the topic. If empty the client ID of this client will be taken.
     * @private
     */
    private smokerizeTopic(topic: string, ownerClientId?: string): string {
        if (topic.startsWith(this._opts.restrictedPrefix)) {
            console.debug("Guessing that the topic is already in correct format. topic:=" + topic);
            return topic;
        }

        const clientId = ownerClientId ? ownerClientId : this._clientId;
        return this._opts.restrictedPrefix + '/' + clientId + '/' + topic;
    }

    /**
     * Generate a new key-pair
     * @private
     */
    private async generateKeyPair(): Promise<KeyPair> {
        await libsodiumReady;
        console.debug("Generating new key-pair...")
        return crypto_sign_keypair();
    }

    /**
     * Setup a {@type IClientOptions} object based on the given clientId and {@type ISmokerMqttClientOptions}
     * @param clientId the client ID which is used to connect to the broker
     * @param smokerOptions the {@type ISmokerMqttClientOptions}
     * @private
     */
    private getBaseClientOptions(clientId: string, smokerOptions: ISmokerMqttClientOptions) {
        return {
            clientId: clientId,
            protocolVersion: 5,
            clean: smokerOptions.clean,
            will: smokerOptions.will,
            properties: {
                authenticationMethod: smokerOptions.smokerAuthMethod
            }
        } as IClientOptions
    }
}