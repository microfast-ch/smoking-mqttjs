import {
    IClientPublishOptions,
    IClientSubscribeOptions,
    ISubscriptionGrant,
    OnConnectCallback,
    OnMessageCallback,
    Packet,
} from "mqtt";
import {KeyPair} from "libsodium-wrappers";
import {Claim, Restriction} from "./domain";
import {OnErrorCallback, OnPacketCallback} from "mqtt/types/lib/client";

export interface ISmokerMqttClient {
    /**
     * Unclaim a topic
     * @param topicName the topic to be unclaimed. Can be either in smoker-format or not. If not it will be formatted correctly.
     */
    unclaim(topic: string): Promise<Packet>;

    /**
     * Claim a topic. The given {@type Restriction} must get wrapped an signed into a {@type Claim}
     * @param restriction the restriction to be used for the claim. Use {@type RestrictionBuilder} to build a restriction.
     */
    claim(restriction: Restriction): Promise<Packet>;

    /**
     * Normal publish of a message
     */
    publish(topic: string, message: string | Buffer, opts?: IClientPublishOptions): Promise<Packet>;

    /**
     * Publish to an already claimed topic
     * @param topic the topic to publish to. Can be either in smoker-format or not. If not it will be formatted correctly.
     * @param message the message to be published
     * @param opts the publish opts
     */
    publishClaimed(topic: string, message: string | Buffer, opts?: IClientPublishOptions): Promise<Packet>;

    /**
     * Normal subscription of one or several topics
     */
    subscribe(topic: string | string[], opts?: IClientSubscribeOptions): Promise<ISubscriptionGrant[]>;

    /**
     * Subscribe to an already claimed topic
     * @param topic the topic to be subscribed. Can be either in smoker-format or not. If not it will be formatted correctly.
     * @param opts the subscription opts
     */
    subscribeClaimed(topic: string, opts?: IClientSubscribeOptions): Promise<ISubscriptionGrant[]>;

    /**
     * Unsubscribe a topic.
     * @param topic the topic to be unsubscribed. Smoker topics must be passed fully qualified.
     * @param opts the unsubscription options
     */
    unsubscribe (topic: string | string[], opts?: Object): Promise<Packet>;

    /**
     * Connect to a smoker broker
     * @param keyPair optional keypair for authentication, if none is provided a new one will be generated
     */
    connect(keyPair?: KeyPair): Promise<string>;

    /**
     * Disconnect from the smoker broker
     */
    disconnect(): Promise<void>;

    /**
     * Creates creates the claim. The claim basically contains the the signed restriction
     * @param restriction the restriction to be signed
     */
    createClaim(restriction: Restriction): Promise<Claim>;

    /**
     * Events that can be handled
     * @param event the event name
     * @param cb the callback
     */
    on(event: 'connect'
           | 'message'
           | 'packetsend'
           | 'packetreceive'
           | 'error',
       cb: OnConnectCallback
           | OnMessageCallback
           | OnPacketCallback
           | OnErrorCallback): ISmokerMqttClient;
}
