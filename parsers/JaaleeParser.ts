import { EventTypes } from './utils/JaaleeConfig';

export class JaaleeParser implements ParserProvider {

    public parserName: string = 'jaalee';
    public serviceDataUuids: Array<string> = ['f51c', 'f525'];

    private readonly baseByteLength: number = 12;

    parse(buffer: Buffer): ParserResult | null {
        if (buffer == null) {
            throw new Error('A buffer must be provided.');
        }

        const msgLength = buffer.length;

        // Adapter le seuil de la longueur minimale
        if (msgLength < this.baseByteLength) {
            throw new Error(`Service data length must be =< 12 bytes. ${JSON.stringify(buffer)}`);
        }

        const result: ParserResult = {
            eventLength: buffer.length,
            macAddress: this.parseMacAddress(buffer),
            parser: this.parserName,
            deviceType: this.parseDeviceType(buffer),
            version: "Jaalee",
            info: this.parseEventData(buffer)
        }
        return result;
    }
    parseDeviceType(buffer: Buffer): string {
        return "JHT";
    }
    parseMacAddress(buffer: Buffer): string {
        const macBuffer = buffer.slice(1, 7);
        return Buffer.from(macBuffer).reverse().toString('hex');
    }
    toString(buffer: Buffer) : string {
        return buffer.toString('hex');
    }
    parseEventData(buffer: Buffer): Object {
        const dataPosition = 8;
        const temperature = this.roundTemperature(buffer.readUInt16BE(dataPosition));
        const humidity = this.roundHumidity(buffer.readUInt16BE(dataPosition + 2));
        const battery = buffer.readUInt8(0);
        const gamma = Math.log(humidity / 100) + 17.27 * temperature / (237.7 + temperature);
        const dewPoint = +(237.7 * gamma / (17.27 - gamma)).toFixed(2);
        return { Temperature: temperature, Humidity: humidity, DewPoint: dewPoint, Battery: battery };
    }
    roundTemperature(temp: number): number {
        return Math.round((175 * temp / 65535 - 45) * 100) / 100;
    }
    roundHumidity(humi: number): number {
        return Math.round((100 * humi / 65535) * 100) / 100;
    }
}
