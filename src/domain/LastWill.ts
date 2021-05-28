import {QoS} from "mqtt-packet";

export class LastWill {
    /**
     * the topic to publish
     */
    topic: string
    /**
     * the message to publish
     */
    payload: Buffer | string
    /**
     * the QoS
     */
    qos: QoS
    /**
     * the retain flag
     */
    retain: boolean

    /*
    *  properies object of will
    * */
    properties?: {
        willDelayInterval?: number,
        payloadFormatIndicator?: boolean,
        messageExpiryInterval?: number,
        contentType?: string,
        responseTopic?: string,
        correlationData?: Buffer,
        userProperties?: Object
    }
}