const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const db = require("./models");
const match = require("./routes/match");

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

//미들웨어 세팅
app.use("/api", match);

//DB연결
dbConnection();

function dbConnection() {
    db.sequelize
        .authenticate()
        .then(() => {
            console.log("✓ Connection has been established successfully.");
            return db.sequelize.sync();
        })
        .then(() => {
            console.log("DB Sync complete.");
        })
        .catch(err => {
            console.error("Unable to connect to the database:", err);
        });
}

app.listen(port);
