const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const app = express();
const port = 8080;

app.use(express.static(__dirname));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function (req, res) {
    res.render('pages/login', {
        error: "",
        activeTab: "login"
    });
})

var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log(`Server started on port ${port}`);
})

app.post('/', (req, res) => {
    var loginUsername = req.body.loginUsername;
    var loginPassword = req.body.loginPassword;
    var registerUsername = req.body.registerUsername;
    var registerPassword = req.body.registerPassword;
    console.log(`
        ${loginUsername}
        ${loginPassword}
        ${registerUsername}
        ${registerPassword}
    `);

    const con = mysql.createConnection({
        host: "104.196.22.212",
        user: "sse665-app",
        password: "GoBears",
        database: "sse665-iot"
    })

    if (registerUsername) {
        con.connect(function (err) {
            if (err) {
                console.log(`Error occurred in SQL connection: ${err.message}`);
            };
            console.log("Connected to database!");
            con.query(
                `SELECT * FROM \`Users\` WHERE \`Username\` = '${registerUsername}'`,
                function (err, result) {
                    if (err) {
                        console.log(`Error occurred in SQL request: ${err.message}`);
                    } else {
                        if (result.length === 0) {
                            con.query(
                                `INSERT INTO \`Users\`(\`Username\`, \`Password\`) VALUES ('${registerUsername}', '${registerPassword}')`,
                                function (err, result) {
                                    if (err) {
                                        console.log(`Error occurred in SQL request: ${err.message}`);
                                    } else {
                                        console.log(`Added new user ${registerUsername} to database!`);
                                    };
                                }
                            );
                        } else {
                            console.log("Name already exists in database!");
                            const errMessage = "Account with that name already exists.";
                            res.render('pages/login', {
                                error: errMessage,
                                activeTab: "register"
                            });
                        };
                    };
                }
            );
        });
    };
})