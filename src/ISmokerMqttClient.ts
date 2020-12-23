import {IClientPublishOptions, IClientSubscribeOptions, ISubscriptionGrant, OnMessageCallback, Packet} from "mqtt";
import {KeyPair} from "libsodium-wrappers";
import {Restriction} from "./domain/Restriction";

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
     * Connect to a smoker broker
     * @param keyPair optional keypair for authentication, if none is provided a new one will be generated
     * @param TODO / cevo / parameterize IClientOptions? Maybe wrap it to never allow custom clinetId's / non smoker auth?
     */
    connect(keyPair?: KeyPair): Promise<void>;

    /**
     * Disconnect from the smoker broker
     */
    disconnect(): Promise<void>;

    on(event: 'message', cb: OnMessageCallback): ISmokerMqttClient;
}
