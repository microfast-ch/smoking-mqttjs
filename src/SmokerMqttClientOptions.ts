import {Store} from "mqtt/types/lib/store";
import {QoS} from "mqtt-packet";
import {LastWill} from "./domain/LastWill";

export interface ISmokerMqttClientOptions {

    /**
     * The broker URL to connect to. Default: "mqtt://127.0.0.1"
     */
    brokerUrl: string

    /**
     * Smoker claim topic. Default: "access/claim"
     */
    claimTopic: string

    /**
     * Smoker unclaim topic. Default: "access/unclaim"
     */
    unclaimTopic: string

    /**
     * Prefix used to claim topics. Default: "restricted"
     */
    restrictedPrefix: string

    /**
     * Smoker authentication method. Default: "SMOKER"
     */
    smokerAuthMethod: string

    /**
     * true, set to false to receive QoS 1 and 2 messages while offline
     */
    clean?: boolean

    /**
     * a message that will sent by the broker automatically when the client disconnect badly.
     */
    will?:  LastWill
}

