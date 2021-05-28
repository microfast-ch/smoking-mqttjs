# SMOKER MQTT client
The `smoking-mqttjs` library is a wrapper of the [MQTT.js](https://github.com/mqttjs) client that provides the SMOKER specific functions to connect, claim and unclaim topics on a SMOKER instance. See the [Docs]() for detailed specifications that this client implements.

> Note that this implementation is based on a [fork](https://github.com/quickstar/MQTT.js) of MQTT.js as the current version does not fully implement the [enhanced authentication](https://docs.oasis-open.org/mqtt/mqtt/v5.0/os/mqtt-v5.0-os.html#_Toc3901256) specified by the MQTT 5.0 protocol.

## Installation
`npm install smoking-mqttjs --save`

## Demo
Feel free to try out the [demo UI](https://smokerui.app.microfast.ch/) which runs this client within a web application.

## Example

Initialize a client. Make Sure you are connecting to a running SMOKER instance. Feel free to use `wss://smive.app.microfast.ch/mqtt`.
```typescript
let client: ISmokerMqttClient = new SmokerMqttClientBuilder()
    .withBrokerUrl("wss://smive.app.microfast.ch/mqtt")
    .build();
```

Setup message handler and claim/unclaim topics and publish/subscribe to them:

```typescript
client.connect(null).then(async (clientId) => {

    // event handlers
    client.on('message', function (topic, message) {
        console.log(message.toString())
    })

    client.on('connect', async () => {

        console.log('Connected with clientId:=' + clientId)
        let testTopic = "it/does/work";
        
        // setup a restriction for claiming
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

        // subscribe claimed topic
        await client
            .subscribeClaimed(testTopic)
            .catch(reason => {
                console.error("Could not subscribe claimed topic. reason:=" + reason)
            });

        // publish to claimed topic
        await client
            .publishClaimed(testTopic, "Publish to my own topic is always allowed!", <IClientPublishOptions>{qos: 1})
            .catch(reason => {
                console.error("Could not publish to claimed topic. reason:=" + reason)
            });
    });
}).catch(reason => {
    console.error("Error connecting to broker. reason:=" + reason)
});
```







