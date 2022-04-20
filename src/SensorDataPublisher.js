'use strict';

const dds = require('vortexdds');
const path = require('path');

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}
main();

function main() {
  publishData().then(() => {
    console.log('=== SensorDataPublisher end');
    process.exit(0);
  }).catch((error) => {
    console.log('Error: ' + error.message);
    process.exit(1);
  });
}

async function publishData() {

  console.log('=== SensorDataPublisher start');

  let participant = null;
  try {
    participant = new dds.Participant();

    const systemTempTopicName = 'SystemTempTopic';
    const roomTempTopicName = 'RoomTempTopic';
    const exhaustTempTopicName = 'ExhaustTempTopic';
    const idlName = 'SensorData.idl';
    const idlPath = __dirname + path.sep + idlName;

    const typeSupports = await dds.importIDL(idlPath);
    const typeSupport = typeSupports.get('SensorData::Sensor');

    const tqos = dds.QoS.topicDefault();

    tqos.durability = { kind: dds.DurabilityKind.Transient };
    tqos.reliability = { kind: dds.ReliabilityKind.Reliable };

    const systemTempTopic = participant.createTopic(
      systemTempTopicName,
      typeSupport,
      tqos,
    );

    const roomTempTopic = participant.createTopic(
      roomTempTopicName,
      typeSupport,
      tqos,
    );

    const exhaustTempTopic = participant.createTopic(
      exhaustTempTopicName,
      typeSupport,
      tqos,
    );

    const pqos = dds.QoS.publisherDefault();

    pqos.partition = { names: 'Sensor example' };
    const pub = participant.createPublisher(pqos);

    const wqos = dds.QoS.writerDefault();

    wqos.durability = { kind: dds.DurabilityKind.Transient };
    wqos.reliability = { kind: dds.ReliabilityKind.Reliable };
    const systemTempWriter = pub.createWriter(systemTempTopic, wqos);
    const roomTempWriter = pub.createWriter(roomTempTopic, wqos);
    const exhaustTempWriter = pub.createWriter(exhaustTempTopic, wqos);

    while (true) {
      await systemTempWriter.writeReliable(getTempData());
      console.log('System temperature successfully send :');
      await roomTempWriter.writeReliable(getTempData());
      console.log('Room temperature successfully send :');
      await exhaustTempWriter.writeReliable(getTempData());
      console.log('Exhaust temperature successfully send :');
      await sleep(1000);
    }

  } finally {
    console.log('=== Cleanup resources');
    if (participant !== null) {
      participant.delete().catch((error) => {
        console.log('Error cleaning up resources: '
          + error.message);
      });
    }
  }

};

function getTempData() {
  return {
    time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
    temperature: (Math.floor(Math.random() * 21) + 10).toString(),
    humidity: (Math.floor(Math.random() * 21) + 10).toString()
  }
}