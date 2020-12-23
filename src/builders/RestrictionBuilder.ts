import {Restriction} from "../domain/Restriction";
import {RestrictionType} from "../domain/RestrictionType";
import {Permission} from "../domain/Permission";
import {MqttActivityType} from "../domain/MqttActivityType";

export class RestrictionBuilder {
    private topic: string;

    private restrictionType: RestrictionType;

    private permissions: Array<Permission> = new Array<Permission>();

    public withTopic(value: string): RestrictionBuilder {
        this.topic = value;
        return this;
    }

    public withRestrictionType(value: RestrictionType): RestrictionBuilder {
        this.restrictionType = value;
        return this;
    }

    /**
     * Add a new Permission to the restriction. Can be called several times.
     * @param value the defined permission. Use {@type PermissionBuilder} to build permissions.
     */
    public withPermission(value: Permission): RestrictionBuilder {
        this.permissions.push(value);
        return this;
    }

    /**
     * Configures a whitelist restriction allowing all smoker clients to publish/subscribe to this topic
     */
    public withAllowAllPermission(): RestrictionBuilder {
        this.restrictionType = RestrictionType.Whitelist
        this.permissions.push(<Permission>{
            activity: MqttActivityType.All,
            clientId: "*"
        });
        return this;
    }

    public build(): Restriction {
        if (!this.topic) throw new Error("The topic name must be specified")
        if (!this.restrictionType) throw new Error("The restrictionType name must be specified")

        return <Restriction>{
            topicName: this.topic,
            permissions: this.permissions,
            restrictionType: this.restrictionType
        };
    }
}