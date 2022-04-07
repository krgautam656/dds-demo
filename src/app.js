const path = require('path')
const express = require('express')
const hbs = require('hbs')
const cors = require('cors')
const fs = require('fs')
const fetch = require('node-fetch')
const rti = require('rticonnextdds-connector')
var convert = require('xml-js')


const uuid = require('uuid')
const cookieParser = require("cookie-parser")
const sessions = require('express-session')

const PORT = process.env.PORT || 3000
var users

const app = express()

const resourcesPath = path.join(__dirname, '../assets')
const templatesPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')
const configFile = path.join(__dirname, '../ShapeExample.xml')

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

app.get(['', '/login'], (req, res) => {
    res.render('login', {
        title: 'Login'
    })
})

app.get('/temperature-dashboard', (req, res) => {
    if (session.username) {
        res.render('temperature-dashboard', {
            title: 'Temperature Dashboard',
            name: session.username
        })
    } else {
        res.render('login', {
            message: 'Please login first!'
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
            message: 'Please login first!'
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

app.get('/details', (req, res) => {
    fetch('http://localhost:8080/dds/rest1/applications/UsersDemoApp/domain_participants/UserParticipant/subscribers/UserSubscriber/data_readers/UserReader')
        .then(response => response.text())
        .then(data => {
            var result = JSON.parse(convert.xml2json(data, { compact: true, spaces: 4 }))
            if ((Object.keys(result.read_sample_seq).length)) {
                console.log('User details successfully consumed..')
            }
            res.send((Object.keys(result.read_sample_seq).length) ? result.read_sample_seq.sample.data : 'Waiting for publications...')
        }).catch(function(err) {
            console.log('Not found: ' + err)
            res.send('Unable to connect dds server..')
        })
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
            message: 'Please login first!'
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

setInterval(() => {
        fetch('http://localhost:8080/dds/rest1/applications/TemperatureDemoApp/domain_participants/TempParticipant/publishers/TempPublisher/data_writers/SystemTempWriter', {
            method: 'POST',
            body: JSON.stringify(getTempData()),
            headers: { 'Content-Type': 'application/json' }
        }).then((res) => {
            if (res.ok) {
                console.log('System temperature successfully published..')
            }
        }).catch((err) => {
            console.log(err);
        });
    },
    1000)

setInterval(() => {
        fetch('http://localhost:8080/dds/rest1/applications/TemperatureDemoApp/domain_participants/TempParticipant/publishers/TempPublisher/data_writers/RoomTempWriter', {
            method: 'POST',
            body: JSON.stringify(getTempData()),
            headers: { 'Content-Type': 'application/json' }
        }).then((res) => {
            if (res.ok) {
                console.log('Room temperature successfully published..')
            }
        }).catch((err) => {
            console.log(err);
        });
    },
    1000)

setInterval(() => {
        fetch('http://localhost:8080/dds/rest1/applications/TemperatureDemoApp/domain_participants/TempParticipant/publishers/TempPublisher/data_writers/ExhaustTempWriter', {
            method: 'POST',
            body: JSON.stringify(getTempData()),
            headers: { 'Content-Type': 'application/json' }
        }).then((res) => {
            if (res.ok) {
                console.log('Exhaust temperature successfully published..')
            }
        }).catch((err) => {
            console.log(err);
        });
    },
    1000)

app.get('/getSystemTempDetails', (req, res) => {
    fetch('http://localhost:8080/dds/rest1/applications/TemperatureDemoApp/domain_participants/TempParticipant/subscribers/TempSubscriber/data_readers/SystemTempReader')
        .then(response => response.text())
        .then(data => {
            var result = JSON.parse(convert.xml2json(data, { compact: true, spaces: 4 }))
            if ((Object.keys(result.read_sample_seq).length)) {
                console.log('System temperature successfully consumed..')
            }
            res.send((Object.keys(result.read_sample_seq).length) ? result.read_sample_seq.sample.data : 'Waiting for publications...')
        }).catch(function(err) {
            console.log('Not found: ' + err)
            res.send('Unable to connect dds server..')
        })
})

app.get('/getRoomTempDetails', (req, res) => {
    fetch('http://localhost:8080/dds/rest1/applications/TemperatureDemoApp/domain_participants/TempParticipant/subscribers/TempSubscriber/data_readers/RoomTempReader')
        .then(response => response.text())
        .then(data => {
            var result = JSON.parse(convert.xml2json(data, { compact: true, spaces: 4 }))
            if ((Object.keys(result.read_sample_seq).length)) {
                console.log('Room temperature successfully consumed..')
            }
            res.send((Object.keys(result.read_sample_seq).length) ? result.read_sample_seq.sample.data : 'Waiting for publications...')
        }).catch(function(err) {
            console.log('Not found: ' + err)
            res.send('Unable to connect dds server..')
        })
})

app.get('/getExhaustTempDetails', (req, res) => {
    fetch('http://localhost:8080/dds/rest1/applications/TemperatureDemoApp/domain_participants/TempParticipant/subscribers/TempSubscriber/data_readers/ExhaustTempReader')
        .then(response => response.text())
        .then(data => {
            var result = JSON.parse(convert.xml2json(data, { compact: true, spaces: 4 }))
            if ((Object.keys(result.read_sample_seq).length)) {
                console.log('Exhaust temperature successfully consumed..')
            }
            res.send((Object.keys(result.read_sample_seq).length) ? result.read_sample_seq.sample.data : 'Waiting for publications...')
        }).catch(function(err) {
            console.log('Not found: ' + err)
            res.send('Unable to connect dds server..')
        })
})

function getTempData() {
    return {
        time: new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
        temperature: (Math.floor(Math.random() * 21) + 10).toString(),
        humidity: (Math.floor(Math.random() * 21) + 10).toString()
    }
}

app.listen(PORT, () => {
    console.log('App Started on port ' + PORT)
})