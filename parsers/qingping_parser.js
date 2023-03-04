// Cleargrass or Qingping

// based on: https://github.com/custom-components/ble_monitor/blob/cf8daa80feeb897162cc2f5b33a3b7aea90d55dc/custom_components/ble_monitor/ble_parser/qingping.py

export const SERVICE_DATA_UUIDS = ['fff9', 'fdcd'];
export const PARSER_NAME = 'qingping';

// Device type dictionary
// {device type code: device name}
const qpTypes = {
  0x01: 'CGG1',
  0x07: 'CGG1',
  0x09: 'CGP1W',
  0x0c: 'CGD1',
  0x10: 'CGDK2' // tested with this
};

const EventTypes = {
  temperatureAndHumidity: 0x01,
  battery: 0x02,
  pressure: 0x07
};

export class Parser {
  constructor(buffer, bindKey = null) {
    this.baseByteLength = 5;
    if (buffer == null) {
      throw new Error('A buffer must be provided.');
    }
    this.buffer = buffer;
    if (buffer.length < this.baseByteLength) {
      throw new Error(`Service data length must be >= 5 bytes. ${JSON.stringify(buffer)}`);
    }
    this.bindKey = bindKey;
  }

  parse() {
    // console.log(JSON.stringify(this.buffer))

    this.deviceType = this.parseDeviceType();
    this.macAddress = this.parseMacAddress();
    this.eventId = this.parseEventId();
    this.event = this.parseEventData(this.eventId);
    return {
      parser: PARSER_NAME,
      macAddress: this.macAddress,
      info: {
        deviceType: this.deviceType,
        eventType: this.eventId,
        event: this.event
      }
    };
  }

  parseDeviceType() {
    let deviceId = this.buffer.readUInt8(1);
    return qpTypes[deviceId] || deviceId;
  }

  parseMacAddress() {
    const macBuffer = this.buffer.slice(2, 8);
    return Buffer.from(macBuffer).reverse().toString('hex');
  }

  toString() {
    return this.buffer.toString('hex');
  }
  parseEventId() {
    return this.buffer.readUInt8(8);
  }
  parseEventData(eventId) {
    let dataPosition = 10;
    //let eventSize = this.buffer.readUInt8(xDataPoint - 1)
    switch (eventId) {
      case EventTypes.temperatureAndHumidity: // temperature & humidity
        const temperature = this.buffer.readInt16LE(dataPosition) / 10;
        const humidity = this.buffer.readUInt16LE(dataPosition + 2) / 10;

        const gamma = Math.log(humidity / 100) + 17.27 * temperature / (237.7 + temperature);
        const dewPoint = +(237.7 * gamma / (17.27 - gamma)).toFixed(2);
        return { Temperature: temperature, Humidity: humidity, DewPoint: dewPoint };
      case EventTypes.battery:
        return { Battery: this.buffer.readUInt8(dataPosition) };
      case EventTypes.pressure:
        return { Pressure: this.buffer.readUInt16LE(dataPosition) };
      default:
        return { unknownData: true };
    }
  }
}
