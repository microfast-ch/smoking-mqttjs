import {Packet} from "mqtt";
import {KeyPair} from "libsodium-wrappers";

export interface ISmokerMqttClient {
    /**
     * Unclaim a topic
     * @param topicName the topic to be unclaimed. Can be either in smoker-format or not. If not it will be formatted.
     */
    unclaim(topicName: string): Promise<Packet>;

    /**
     * Unclaim a topic
     * @param topicName the topic to be unclaimed. Can be either in smoker-format or not. If not it will be formatted.
     */
    claim(topicName: string): Promise<Packet>;

    /**
     * Connect to a smoker broker
     * @param keyPair optional keypair for authentication, if none is provided a new one will be generated
     * @param TODO / cevo / parameterize IClientOptions? Maybe wrap it to never allow custom clinetId's / non smoker auth?
     */
    connect(keyPair: KeyPair): Promise<void>;

    /**
     * Disconnect from the smoker broker
     */
    disconnect(): Promise<void>;
}
