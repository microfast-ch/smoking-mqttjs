import {ISmokerMqttClient} from "./ISmokerMqttClient";
import {SmokerMqttClientBuilder} from "./SmokerMqttClientBuilder";

let client: ISmokerMqttClient = new SmokerMqttClientBuilder().build();
client.connect(null).then(async () => {
    await client.claim("geil/es/geit");
    await client.unclaim("geil/es/geit")
    await client.disconnect();
});






