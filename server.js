const express = require("express")
const bodyParser = require("body-parser")
const launcher = require('./launcher.js');
const passwords = require('./config.json').passwords;
const messages = require('./config.json').serverMessages;


const app = express();
const PORT = 8080;


app.use(bodyParser.json())
app.listen(PORT, '0.0.0.0', () => console.log(`Server has been launched on port ${PORT}`))
app.use(bodyParser.json())
app.post("/hook", (req, res) => {
    // let statusCode;
    // let statusMessage;
    // if (passwords.includes(req.body.password)) {
    //     //launcher.launch();
    //     statusCode = 200;
    //     statusMessage = JSON.stringify(messages.success);
    // } else {
    //     statusCode = 403;
    //     statusMessage = JSON.stringify(messages.error);
    // }
        // res.status(statusCode).end(statusMessage);
    console.log(req.body);
    res.status(200).end("ok");
});