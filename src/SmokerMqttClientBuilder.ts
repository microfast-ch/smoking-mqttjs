import {ISmokerMqttClient} from "./ISmokerMqttClient";
import {SmokerMqttClient} from "./SmokerMqttClient";
import {ISmokerMqttClientOptions} from "./SmokerMqttClientOptions";

export class SmokerMqttClientBuilder {
    private brokerUrl: string = "mqtt://127.0.0.1";

    private claimTopic: string = "access/claim";

    private unclaimTopic: string = "access/unclaim";

    private restrictedPrefix: string = "restricted";

    private smokerAuthMethod: string = "SMOKER";

    public withClaimTopic(value: string): SmokerMqttClientBuilder {
        this.claimTopic = value;
        return this;
    }

    public withRestrictedPrefix(value: string): SmokerMqttClientBuilder {
        this.restrictedPrefix = value;
        return this;
    }

    public withUnclaimTopic(value: string): SmokerMqttClientBuilder {
        this.unclaimTopic = value;
        return this;
    }

    public withSmokerAuthMethod(value: string): SmokerMqttClientBuilder {
        this.smokerAuthMethod = value;
        return this;
    }

    public withBrokerUrl(value: string): SmokerMqttClientBuilder {
        this.brokerUrl = value;
        return this;
    }

    public build(): ISmokerMqttClient {
        return new SmokerMqttClient(<ISmokerMqttClientOptions>{
            brokerUrl: this.brokerUrl,
            unclaimTopic: this.unclaimTopic,
            claimTopic: this.claimTopic,
            restrictedPrefix: this.restrictedPrefix,
            smokerAuthMethod: this.smokerAuthMethod
        })
    }
}
