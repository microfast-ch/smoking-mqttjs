import {ISmokerMqttClient} from "./ISmokerMqttClient";
import {SmokerMqttClientBuilder} from "./SmokerMqttClientBuilder";
import {IClientPublishOptions} from "mqtt";

let client: ISmokerMqttClient = new SmokerMqttClientBuilder()
    .withBrokerUrl("mqtt://127.0.0.1")
    .build();

client.connect(null).then(async () => {

    let testTopic = "geil/es/geit";

    client.on('message', function (topic, message) {
        console.log(message.toString())
    })

    // claim
    await client
        .claim(testTopic)
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

    // publish to unclaimed
    await client
        .publishClaimed(testTopic, "Publish to an unclaimed topic is not allowed", <IClientPublishOptions>{qos: 1})
        .catch(reason => {
            console.error("Could not publish to claimed topic. reason:=" + reason)
        });

    await client.disconnect();
}).catch(reason => {
    console.error("Error connecting to broker. reason:=" + reason)
});






