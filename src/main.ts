import {ISmokerMqttClient} from "./ISmokerMqttClient";
import {SmokerMqttClientBuilder} from "./SmokerMqttClientBuilder";

let client: ISmokerMqttClient = new SmokerMqttClientBuilder().build();
client.connect(null).then(async () => {

    let testTopic = "geil/es/geit";

    // claim
    await client
        .claim(testTopic)
        .catch(reason => {
            console.error("Could not claim topic. reason:=" + reason)
        });

    // unclaim
    await client
        .unclaim(testTopic)
        .catch(reason => {
           console.error("Coult not unclaim topic. reason:=" + reason)
        });

    await client.disconnect();
}).catch(reason => {
    console.error("Error connecting to broker. reason:=" + reason)
});






