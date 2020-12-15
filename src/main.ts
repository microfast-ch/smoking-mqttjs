import { SmokerMqttClient } from "./SmokerMqttClient";

let client = new SmokerMqttClient();
client.connect().then(async ()  => {
    await client.claim("geil/es/geit");
    // await client.disconnect();
});






