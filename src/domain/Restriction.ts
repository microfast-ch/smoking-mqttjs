import {Permission} from "./Permission";
import {RestrictionType} from "./RestrictionType";

export class Restriction {
    public topicName : string;

    public restrictionType : RestrictionType;

    public permissions: Array<Permission>;
}
