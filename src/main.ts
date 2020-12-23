import {ISmokerMqttClient} from "./ISmokerMqttClient";
import {SmokerMqttClientBuilder} from "./builders/SmokerMqttClientBuilder";
import {IClientPublishOptions} from "mqtt";
import {RestrictionBuilder} from "./builders/RestrictionBuilder";

let client: ISmokerMqttClient = new SmokerMqttClientBuilder()
    .withBrokerUrl("mqtt://127.0.0.1")
    .build();

client.connect(null).then(async () => {

    // event handlers
    client.on('message', function (topic, message) {
        console.log(message.toString())
    })

    // setup a restriction for claiming
    let testTopic = "geil/es/geit";
    let allowAllRestriction = new RestrictionBuilder()
        .withTopic(testTopic)
        .withAllowAllPermission()
        .build()

    // claim
    await client
        .claim(allowAllRestriction)
        .catch(reason => {
            console.error("Could not claim topic. reason:=" + reason)
        });

    // subscribe claimed
    await client
        .subscribeClaimed(testTopic)
        .catch(reason => {
            console.error("Could not subscribe claimed topic. reason:=" + reason)
        });

    // publish claimed
    await client
        .publishClaimed(testTopic, "Publish to my own topic is always allowed!", <IClientPublishOptions>{qos: 1})
        .catch(reason => {
            console.error("Could not publish to claimed topic. reason:=" + reason)
        });

    // unclaim
    await client
        .unclaim(testTopic)
        .catch(reason => {
            console.error("Coult not unclaim topic. reason:=" + reason)
        });

    // publish to unclaimed -> NOT AUTHORIZED!
    await client
        .publishClaimed(testTopic, "Publish to an unclaimed topic is not allowed", <IClientPublishOptions>{qos: 1})
        .catch(reason => {
            console.error("Could not publish to claimed topic. reason:=" + reason)
        });

    await client.disconnect();
}).catch(reason => {
    console.error("Error connecting to broker. reason:=" + reason)
});






