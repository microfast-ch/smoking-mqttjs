import {ISmokerMqttClient} from "./ISmokerMqttClient";
import {SmokerMqttClientBuilder, RestrictionBuilder} from "./builders";
import {IClientPublishOptions} from "mqtt";

let client: ISmokerMqttClient = new SmokerMqttClientBuilder()
    .withBrokerUrl("ws://127.0.0.1:8000/mqtt")
    .build();

client.connect(null).then(async (clientId) => {

    // event handlers
    client.on('message', function (topic, message) {
        console.log(message.toString())
    })

    client.on('connect', async () => {

        console.log('Connected with clientId:=' + clientId)

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
            .publish('restricted/5EBV5HWQX4YX36AJUP5OXOT2PFTYCO6WAWJSCKY6Q4DKKLXBOX7Q====/aaaaa', "Publish to an unclaimed topic is not allowed", <IClientPublishOptions>{qos: 1})
            .then(() => {
                console.log("jajajaja")
            })
            .catch(reason => {
                console.error("Could not publish to claimed topic. reason:=" + reason)
            });

        await client.disconnect();
    });
}).catch(reason => {
    console.error("Error connecting to broker. reason:=" + reason)
});






