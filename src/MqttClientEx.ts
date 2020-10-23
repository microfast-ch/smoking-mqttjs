import { MqttClient, PacketCallback, StorePutCallback } from 'mqtt';
import { Packet } from 'mqtt-packet';

export declare class MqttClientEx extends MqttClient {
        /**
     * _sendPacket - send or queue a packet
     * @param {Packet} packet - packet options
     * @param {Function} [cb] - callback fired on unsuback
     * @param {Function} cb - callback when the packet is sent
     * @param {Function} cbStorePut - called when message is put into outgoingStore
     * @api private
     */
    public _sendPacket(packet: Packet, cb?: PacketCallback, cbStorePut?: StorePutCallback): void
}
