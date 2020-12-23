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
}

