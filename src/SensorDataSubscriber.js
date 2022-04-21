'use strict';

const dds = require('vortexdds');
const path = require('path');

main();

function main() {
  subscribeData().then(() => {
    console.log('=== SensorDataSubscriber end');
    process.exit(0);
  }).catch((error) => {
    console.log('Error: ' + error.message);
    process.exit(1);
  });
}

async function subscribeData() {

  console.log('=== SensorDataSubscriber start');

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

    const sqos = dds.QoS.subscriberDefault();

    sqos.partition = { names: 'Track example' };
    const sub = participant.createSubscriber(sqos);

    const rqos = dds.QoS.readerDefault();

    rqos.durability = { kind: dds.DurabilityKind.Transient };
    rqos.reliability = { kind: dds.ReliabilityKind.Reliable };
    const systemTempReader = sub.createReader(systemTempTopic, rqos);
    const roomTempReader = sub.createReader(roomTempTopic, rqos);
    const exhaustTempReader = sub.createReader(exhaustTempTopic, rqos);

    console.log('=== [Subscriber] Ready ...');
    await takeData(systemTempReader);
    await takeData(roomTempReader);
    await takeData(exhaustTempReader);

  } finally {
    console.log('=== Cleanup resources');
    if (participant !== null) {
      participant.delete().catch((error) => {
        console.log('Error cleaning up resources: '
          + error.message);
      });
    }
  }
}

function takeData(reader) {
  return new Promise(resolve => {
    let interval = setInterval(() => {
      let takeArray = reader.take(1);
      if (takeArray.length > 0 && takeArray[0].info.valid_data) {
        console.log('=== [Subscriber] message received :');
        console.log(takeArray);
      }
    }, 200);
  });
}
