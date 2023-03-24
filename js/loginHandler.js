const express = requre('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrpyt');
const app = express();

const con = mysql.createConnection({
    host: "104.196.22.212",
    user: "sse665-app",
    password: "GoBears",
})

app.use(bodyParser.urlencoded({extended: true}));

app.post('/login', (req) => {
    loginUsername = req.body.loginName;
    loginPassword = req.body.loginPassword;
})

app.post('/register', (req) => {
    registerUsername = req.body.registerUsername;
    registerPassword = req.body.registerPassword;
})

const port = 8080;

app.listen(port, () => {
    console.log('Server running on port${port}')
})

if (typeof registerUsername !== 'undefined') {
    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        con.query(
            "INSERT INTO 'Users'('Username', 'Password') VALUES (registerUsername, registerPassword",
            function (err, result) {
                if (err) throw err;
                console.log("Query did a thing");
        });
    });
}