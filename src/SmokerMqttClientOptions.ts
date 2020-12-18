export interface ISmokerMqttClientOptions {
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

