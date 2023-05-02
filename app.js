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
    var session = req.session
    if (typeof session.username === 'undefined') {
        res.redirect('/login')
        return
    }
    res.render('pages/home', {
        user: session.username
    })
})

app.get('/login', (req, res) => {
    var session = req.session
    if(session.username) {
        res.redirect('/')
    } else {
        res.render('pages/login', {
            activeTab: "login"
        });
    };
})

app.get('/register', (req, res) => {
    var session = req.session
    if (session.username) {
        res.redirect('/')
    } else {
        res.render('pages/login', {
            activeTab: "register"
        });
    };
})

app.get('/logout', function (req, res) {
    var session = req.session
    session.destroy();
    res.redirect('/login');
})

app.post('/login', (req, res) => {
    var session = req.session
    let loginUsername = req.body.loginUsername;
    let loginPassword = req.body.loginPassword;
    console.log(loginUsername)
    console.log(loginPassword)
    console.log("Attempting login!")

    con.query(
        `SELECT Password FROM Users WHERE Username = '${loginUsername}'`,
        function (err, result) {
            if (err) {
                console.log(`Error occurred in SQL request: ${err.message}`);
                return
            }
            console.log(result)
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
            if (!(result[0].Password === loginPassword)) {
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
            session.username = loginUsername;
            res.redirect("/");
        }
    );
})

app.post('/register', (req, res) => {
    var session = req.session
    let registerUsername = req.body.registerUsername;
    let registerPassword = req.body.registerPassword;

    con.query(
        `SELECT * FROM \`Users\` WHERE \`Username\` = '${registerUsername}'`,
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
                `INSERT INTO \`Users\`(\`Username\`, \`Password\`) VALUES ('${registerUsername}', '${registerPassword}')`,
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