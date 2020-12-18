import {SmokerMqttClient} from "./SmokerMqttClient";
import {ISmokerMqttClient} from "./ISmokerMqttClient";

let client: ISmokerMqttClient = new SmokerMqttClient();
client.connect(null).then(async () => {
    await client.claim("geil/es/geit");
    await client.unclaim("geil/es/geit")
    await client.disconnect();
});






