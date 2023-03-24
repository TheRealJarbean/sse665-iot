const express = requre('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

var con = mysql.createConnection({
    host: "",
    user: "",
    password: "",
})

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    con.query("", function (err, result) {
        if (err) throw err;
        console.log("Query did a thing");
    });
});