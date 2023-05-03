const express = require('express');
const cookieParser = require('cookie-parser');
const sessions = require('express-session');
const mysql = require('mysql');
const ejs = require('ejs');
const app = express();
const port = 8080;

app.use(express.static(__dirname));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Start Node server
var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log(`Server started on host ${host}`)
    console.log(`Server started on port ${port}`);
})

// Database connection configuration
const con = mysql.createConnection({
    host: "104.196.22.212",
    user: "sse665-app",
    password: "GoBears",
    database: "sse665-iot"
})

// Attempt to establish database connection
con.connect(function (err) {
    if (err) {
        console.log(`Error occurred in SQL connection: ${err.message}`);
        return
    };
    console.log("Connected to database!");
})

const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
    secret: "Thisismysupersecretsecret",
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: true
}));

var session;

app.get('/', (req, res) => {
    session = req.session
    page = req.originalUrl
    if (typeof session.username === 'undefined') {
        res.redirect('/login')
        return
    }
    res.render('pages/home', {
        page: page,
        user: session.username
    })
})

app.get('/login', (req, res) => {
    session = req.session
    if(session.username) {
        res.redirect('/')
    } else {
        res.render('pages/login', {
            activeTab: "login"
        });
    };
})

app.get('/register', (req, res) => {
    session = req.session
    if (session.username) {
        res.redirect('/')
    } else {
        res.render('pages/login', {
            activeTab: "register"
        });
    };
})

app.get('/logout', function (req, res) {
    session = req.session;
    session.destroy();
    res.redirect('/login');
})

app.get('/devices', function (req, res) {
    session = req.session;
    page = req.originalUrl;

    if (typeof session.username === 'undefined') {
        res.redirect('/login');
        return;
    }

    console.log(session.userID)

    con.query(
        `SELECT device_id, brand_id, name, type, current_status, room 
        FROM devices WHERE devices.user_id = '${session.userID}'`,
        (err, result) => {
            if (err) {
                console.log(`Error occurred in SQL request: ${err.message}`);
                return
            }

            let devices = result;
            let rooms = devices.map(device => device.room);
            let registeredBrands = devices.map(device => device.brand_id);

            function onlyUnique(value, index, array) {
                return array.indexOf(value) === index;
            }

            rooms = rooms.filter(onlyUnique);
            console.log("Rooms:", rooms)
            registeredBrands = registeredBrands.filter(onlyUnique);

            con.query(
                `SELECT * FROM brands`,
                (err, result) => {
                    if (err) {
                        console.log(`Error occurred in SQL request: ${err.message}`);
                        return;
                    }
            
                    let brands = result;

                    // TODO: Make rooms list from database query
                    res.render('pages/devices', {
                        page: page,
                        user: session.username,
                        devices: devices,
                        rooms: rooms,
                        brands: brands,
                        registeredBrands: registeredBrands
                    })
                }
            )
        }
    )
})

app.post('/login', (req, res) => {
    session = req.session
    let loginUsername = req.body.loginUsername;
    let loginPassword = req.body.loginPassword;
    console.log(loginUsername)
    console.log(loginPassword)
    console.log("Attempting login!")

    con.query(
        `SELECT user_id, password FROM users WHERE username = '${loginUsername}'`,
        (err, result) => {
            if (err) {
                console.log(`Error occurred in SQL request: ${err.message}`);
                return
            }

            if(result.length === 0) {
                console.log("Account not found!");
                let message = {
                    color: "red",
                    content: "Account not found."
                }
                res.render('pages/login', {
                    activeTab: "login",
                    message: message
                });
                return
            } 
    
            if (!(result[0].password === loginPassword)) {
                console.log("Password incorrect!");
                let message = {
                    color: "red",
                    content: "Password is incorrect"
                }
                res.render('pages/login', {
                    activeTab: "login",
                    message: message
                });
                return
            }

            console.log("Redirecting to home page!");
            session.userID = result[0].user_id
            session.username = loginUsername;
            res.redirect("/");
        }
    )
})

app.post('/register', (req, res) => {
    session = req.session
    let registerUsername = req.body.registerUsername;
    let registerPassword = req.body.registerPassword;

    con.query(
        `SELECT * FROM users WHERE username = '${registerUsername}'`,
        function (err, result) {
            if (err) {
                console.log(`Error occurred in SQL request: ${err.message}`);
                return
            }

            console.log(result)

            if (result.length !== 0) {
                console.log("Name already exists in database!");
                let message = {
                    color: "red",
                    content: "Account with that name already exists."
                }
                res.render('pages/login', {
                    activeTab: "register",
                    message: message
                });
                return
            }

            con.query(
                `INSERT INTO users (username, password) VALUES ('${registerUsername}', '${registerPassword}')`,
                function (err, result) {
                    if (err) {
                        console.log(`Error occurred in SQL request: ${err.message}`);
                        return
                    }

                    console.log(`Added new user ${registerUsername} to database!`);
                }
            );
            let message = {
                color: "green",
                content: "Account successfully created"
            }
            res.render('pages/login', {
                activeTab: "login",
                message: message
            });
        }
    );
})

app.post('/devices/create', (req, res) => {
    session = req.session;
    let userID = session.userID
    let brandID = req.body.brand;
    let name = req.body.name;
    let type = req.body.type;
    let deviceStatus;
    let room = req.body.room;

    // Room stored in Title case for nice display later
    room = room.toLowerCase()
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ');

    // Set default state depending on type
    // TODO: Use an actual API for this
    if (type === "toggle" || type === "whiteLight") {
        deviceStatus= "off";
    }
    else if (type === "rgbLight") {
        deviceStatus = "#eb0800"; // Default color red
    }

    con.query(
        `INSERT INTO devices (user_id, brand_id, name, type, current_status, room)
        VALUES (${session.userID}, ${brandID}, '${name}', '${type}', '${deviceStatus}', '${room}')`,
        (err, result) => {
            if (err) {
                console.log(`Error occurred in SQL request: ${err.message}`);
                return
            }

            console.log("New device added!")
            res.redirect('/devices')
        }
    )
})

app.get('/devices/updateStatus/:deviceID/:newStatus', (req, res) => {
    let deviceID = req.params.deviceID;
    let newStatus = req.params.newStatus;

    con.query(
        `UPDATE devices
        SET current_status = '${newStatus}'
        WHERE device_id = ${deviceID}`,
        (err, result) => {
            if (err) {
                console.log(`Error occurred in SQL request: ${err.message}`);
                return
            }

            console.log("Device status updated.")
        }
    )

    res.redirect('/devices')
})

app.get('/devices/delete/:deviceID', (req, res) => {
    let deviceID = req.params.deviceID;

    con.query(
        `DELETE FROM devices where device_id = '${deviceID}'`,
        (err, result) => {
            console.log(`Device ${deviceID} has been deleted.`)
        }
    )

    res.redirect('/devices')
})