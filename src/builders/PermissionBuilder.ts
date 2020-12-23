import {Permission} from "../domain/Permission";
import {MqttActivityType} from "../domain/MqttActivityType";

export class PermissionBuilder {
    public clientId: string;

    public activity: MqttActivityType;

    /**
     * Allowed clientId. Use "*" to include all smoker clients
     * @param value the client or "*" to include all
     */
    public withClientId(value: string): PermissionBuilder {
        this.clientId = value;
        return this;
    }

    public withActivity(value: MqttActivityType): PermissionBuilder {
        this.activity = value;
        return this;
    }

    public build(): Permission {
        if (!this.clientId) throw new Error("The clientId name must be specified")
        if (!this.activity) throw new Error("The activity name must be specified")

        return <Permission>{
            clientId: this.clientId,
            activity: this.activity,
        };
    }
}