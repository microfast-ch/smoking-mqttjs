import { SmokerMqttClient } from "./SmokerMqttClient";

let client = new SmokerMqttClient();
client.connect().then(() => {
    console.log("IsConnected:=" + client.mqttClient.connected)
    client.mqttClient.subscribe("test");
    client.claim("geil/es/geit");
    client.disconnect();
});






