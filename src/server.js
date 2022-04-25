const path = require('path')
const express = require('express')
const hbs = require('hbs')
const cors = require('cors')
const fs = require('fs')
const dds = require('vortexdds')
const uuid = require('uuid')
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');
require('dotenv').config();

const cookieParser = require("cookie-parser")
const sessions = require('express-session')

const PORT = process.env.PORT || 3000
var users

const app = express()

if (!process.env.ISSUER_BASE_URL || !process.env.AUDIENCE) {
    throw 'Make sure you have ISSUER_BASE_URL, and AUDIENCE in your .env file';
}

const corsOptions = {
    origin: 'http://localhost:3000'
};

app.use(cors(corsOptions));
const checkJwt = auth();

app.get('/api/public', function (req, res) {
    res.json({
        message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
    });
});

app.get('/api/private', checkJwt, function (req, res) {
    res.json({
        message: 'Hello from a private endpoint! You need to be authenticated to see this.'
    });
});

app.get('/api/private-scoped', checkJwt, requiredScopes('read:messages'), function (req, res) {
    res.json({
        message: 'Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this.'
    });
});

app.use(function (err, req, res, next) {
    console.error(err.stack);
    return res.set(err.headers).status(err.status).json({ message: err.message });
});

const resourcesPath = path.join(__dirname, '../assets')
const templatesPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')

app.set('view engine', 'hbs')
app.set('views', templatesPath)
hbs.registerPartials(partialsPath)

app.use(express.urlencoded({
    extended: true
}))
app.use(cors())
app.use(express.static(resourcesPath))
app.use(cookieParser())

const oneDay = 1000 * 60 * 60 * 24
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}))

var session
app.use((req, res, next) => {
    if (!req.session.initialised) {
        req.session.initialised = true
        session = req.session
    }
    next()
})

var currTemp1 = {};
var currTemp2 = {};
var currTemp3 = {};
app.get('/getSystemTempDetails', (req, res) => {
    res.send(currTemp1);
})

app.get('/getRoomTempDetails', (req, res) => {
    res.send(currTemp2);
})

app.get('/getExhaustTempDetails', (req, res) => {
    res.send(currTemp3);
})

var notificationName = '';
app.get('/sendNotification', (req, res) => {
    notificationName = req.query.name;
    res.sendStatus(200);
})

app.get('/getSensorNotification', (req, res) => {
    var name = notificationName;
    if (name != '') {
        notificationName = '';
    }
    res.send({
        name: name
    });
})

var startDate = new Date();
app.get('/controlTemperature', (req, res) => {
    startDate = new Date();
    var name = req.query.name;
    if (name == 'system') {
        systemTemp = 5;
    } else if (name == 'room') {
        roomTemp = 5;
    } else if (name == 'exhaust') {
        exhaustTemp = 5;
    }

    res.sendStatus(200);
})

setInterval(function () {
    if (((new Date() - startDate.getTime()) / 1000) > 60) {
        systemTemp = 0;
        roomTemp = 0;
        exhaustTemp = 0;
    }
}, 1000);

function sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}

main();

function main() {
    subscribeData().then(() => {
        console.log('=== SensorDataSubscriber end');
        process.exit(0);
    }).catch((error) => {
        console.log('Error: ' + error.message);
        process.exit(1);
    });

    publishData().then(() => {
        console.log('=== SensorDataPublisher end');
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

        sqos.partition = { names: 'Sensor example' };
        const sub = participant.createSubscriber(sqos);

        const rqos = dds.QoS.readerDefault();

        rqos.durability = { kind: dds.DurabilityKind.Transient };
        rqos.reliability = { kind: dds.ReliabilityKind.Reliable };

        sub.createReader(
            systemTempTopic,
            rqos,
            {
                onDataAvailable: function (entity) {
                    let takeArray = entity.take(1);
                    if (takeArray.length > 0 && takeArray[0].info.valid_data) {
                        console.log('System temperature successfully received :');
                        currTemp1 = {
                            time: takeArray[0].sample.time,
                            temperature: takeArray[0].sample.temperature,
                            temperature: takeArray[0].sample.temperature,
                            humidity: takeArray[0].sample.humidity
                        }
                    }
                }
            });

        sub.createReader(
            roomTempTopic,
            rqos,
            {
                onDataAvailable: function (entity) {
                    let takeArray = entity.take(1);
                    if (takeArray.length > 0 && takeArray[0].info.valid_data) {
                        console.log('Room temperature successfully received :');
                        currTemp2 = {
                            time: takeArray[0].sample.time,
                            temperature: takeArray[0].sample.temperature,
                            temperature: takeArray[0].sample.temperature,
                            humidity: takeArray[0].sample.humidity
                        }
                    }
                }
            });

        sub.createReader(
            exhaustTempTopic,
            rqos,
            {
                onDataAvailable: function (entity) {
                    let takeArray = entity.take(1);
                    if (takeArray.length > 0 && takeArray[0].info.valid_data) {
                        console.log('Exhaust temperature successfully received :');
                        currTemp3 = {
                            time: takeArray[0].sample.time,
                            temperature: takeArray[0].sample.temperature,
                            temperature: takeArray[0].sample.temperature,
                            humidity: takeArray[0].sample.humidity
                        }
                    }
                }
            });

        while (true) {
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
            await systemTempWriter.writeReliable(getTempData(systemTemp));
            console.log('System temperature successfully send :');
            await roomTempWriter.writeReliable(getTempData(roomTemp));
            console.log('Room temperature successfully send :');
            await exhaustTempWriter.writeReliable(getTempData(exhaustTemp));
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

var systemTemp = 0;
var roomTemp = 0;
var exhaustTemp = 0;

function getTempData(temp) {
    return {
        time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
        temperature: (Math.floor(Math.random() * (21 - temp)) + 10).toString(),
        humidity: (Math.floor(Math.random() * (21 - temp)) + 10).toString()
    }
}

app.get(['', '/login'], (req, res) => {
    res.render('login', {
        title: 'Login'
    })
})

app.get('/temperature-dashboard', (req, res) => {
    if (session.username) {
    res.render('temperature-dashboard', {
        title: 'Temperature Dashboard',
        name: session.username,
        hidden: session.createdBy!=''?'hidden':''
    })
    } else {
        res.render('login', {
            message: 'Session expired! Please login first!'
        })
    }
})

app.get('/user-dashboard', (req, res) => {
    if (session.username) {
    res.render('user-dashboard', {
        title: 'User Dashboard',
        name: session.username
    })
    } else {
        res.render('login', {
            message: 'Session expired! Please login first!'
        })
    }
})

app.get('/users', (req, res) => {
    users = getUsers().filter(el => el.createdBy === session.userId)
    var start = req.query.start
    var length = req.query.length
    var search = req.query.search.value
    var data = getUsers().filter(el => el.createdBy === session.userId)

    var total = 0
    var filter = 0
    if (typeof start !== 'undefined') {
        data = users.slice(parseInt(start), (parseInt(start) + parseInt(length)))
        total = users.length
        filter = users.length
    }

    //if (search != '') {
    //data = data.filter(obj => Object.values(obj).some(val => val.includes(search)))
    //total = users.length
    //filter = data.length
    //}

    res.send({
        'recordsTotal': total,
        'recordsFiltered': filter,
        'data': data
    })
})

app.post('/updateUser', (req, res) => {
    const userInfo = req.body
    var users = getUsers();
    var index = users.findIndex(el => el.email === userInfo.email)
    users[index].firstName = userInfo.firstName
    users[index].lastName = userInfo.lastName
    users[index].email = userInfo.email
    users[index].gender = userInfo.gender
    users[index].phoneNumber = userInfo.phoneNumber
    users[index].dob = userInfo.dob
    fs.writeFileSync('./users.json', JSON.stringify(users))
    res.status(200).send({ message: "successfully updated!!" })
})

app.get('/profile', (req, res) => {
    if (session.username) {
        res.render('profile', {
            title: 'Profile',
            name: session.username,
            data: getUsers().find(el => el.id === session.userId)
        })
    } else {
        res.render('login', {
            message: 'Session expired! Please login first!'
        })
    }
})

app.get('/logout', (req, res) => {
    req.session.destroy()
    res.render('login', {
        title: 'Login',
        message: 'Successfully logout'
    })
})

app.post('/login', (req, res) => {
    const userInfo = req.body
    const user = getUsers().find(el => el.email === userInfo.userName)
    if (user) {
        if (user.password == userInfo.password) {
            session.username = user.firstName + ' ' + user.lastName
            session.userId = user.id
            session.createdBy = user.createdBy
            res.send({
                'Success': 'Success!',
                'createdBy': user.createdBy
            })
        } else {
            return res.status(401).send({ message: "Invalid Password!" })
        }
    } else {
        return res.status(404).send({ message: "User Not found." })
    }
})

app.get('/register', (req, res) => {
    res.render('register', {
        title: 'Sign Up'
    })
})

app.post('/register', (req, res) => {
    users = getUsers()
    const userInfo = req.body
    const user = users.find(el => el.email === userInfo.email)

    if (!user) {
        const id = uuid.v4()
        userInfo.id = id

        if (session.userId) {
            userInfo.createdBy = session.userId
        } else {
            userInfo.createdBy = ''
        }

        users.push(userInfo)
        fs.writeFileSync('./users.json', JSON.stringify(users))

        res.send({ message: "User registered successfully,You can login now." })
    } else {
        res.status(400).send({ message: "Failed! Email is already in use!" })
    }
})

function getUsers() {
    return JSON.parse(fs.readFileSync('./users.json', 'utf8'))
}

app.listen(PORT, () => {
    console.log('App Started on port ' + PORT)
})
