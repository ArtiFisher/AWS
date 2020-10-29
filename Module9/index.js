const http = require("http");
const path = require("path");
const fs = require("fs");
const AWS = require('aws-sdk');
const express = require("express");
const { Sequelize, QueryTypes } = require('sequelize');
const bodyParser = require('body-parser');

require('dotenv').config()

const TOPIC_ARN = 'arn:aws:sns:eu-west-1:126492617923:image-upload';

AWS.config.update({region: 'eu-west-1'});

const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const sns = new AWS.SNS({apiVersion: '2010-03-31'});
const lambda = new AWS.Lambda({apiVersion: '2015-03-31'});

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_LOGIN, process.env.DB_PASSWORD, {
  host     : process.env.DB_HOST,
  dialect  : process.env.DB_DIALECT
});

const app = express();
const httpServer = http.createServer(app);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

s3.waitFor('bucketNotExists', { Bucket: process.env.BUCKET_NAME }, function(err, data) {
  if (err) console.log(err, err.stack);
  else {
    lambda.invoke({
      FunctionName: 'bucket-creator',
      InvocationType: 'RequestResponse',
      LogType: 'Tail',
      Payload: JSON.stringify({ bucketName: process.env.BUCKET_NAME })
    }, function(err, data) {
      err && console.log(err);
      data && console.log(data);
    })
  }
});

app.use(bodyParser.urlencoded({ extended: true }));

// app.get("/", express.static(path.join(__dirname, "./public")));
app.use(express.static(path.join(__dirname, "./public")));

const multer = require("multer");

const handleError = (err, res) => {
    console.log(err)
  res
    .status(500)
    .contentType("text/plain")
    .end("Oops! Something went wrong!");
};

const upload = multer({
  dest: path.join(__dirname, "./images")
});

app.post(
  "/upload",
  upload.single("file"),
  (req, res) => {
    const tempPath = req.file.path;
    if (path.extname(req.file.originalname).toLowerCase() === ".png") {
        s3.upload({
            Bucket: process.env.BUCKET_NAME,
            Key: req.file.originalname,
            Body: fs.readFileSync(tempPath)
        }, function(err, data) {
            if (err) {
                throw err;
            }
            const currentDate = new Date().toLocaleString();
            sequelize.query(`INSERT INTO images (name, uploaded) VALUES ("${req.file.originalname}", "${currentDate}");`,
            { logging: console.log, type: QueryTypes.INSERT })
            sns.publish({
              Message: 'New image has been uploaded!',
              TopicArn: TOPIC_ARN
            }).promise().then(() => console.log('Subscribers notified')).catch(console.error);
            res
                .status(200)
                .contentType("text/plain")
                .end(`File uploaded at ${currentDate}`);
        });
    } else {
      fs.unlink(tempPath, err => {
        if (err) return handleError(err, res);

        res
          .status(403)
          .contentType("text/plain")
          .end("Only .png files are allowed!");
      });
    }
  }
);

app.post("/subscribed", (req, res) => {
  sns.subscribe({
    Protocol: 'EMAIL', 
    TopicArn: TOPIC_ARN,
    Endpoint: req.body.email
  }, (err) => {
      if (err) {
          console.log(err);
      } else {
          res
            .status(200)
            .contentType("text/plain")
            .end(`${req.body.email} subscribed`);
      }
  });
});

app.post("/unsubscribed", (req, res) => {
  sns.listSubscriptionsByTopic({ TopicArn: TOPIC_ARN }, (err, data) => {
    const sub = data.Subscriptions.find(({ Endpoint }) => Endpoint === req.body.email)
    if (err || !sub) {
        console.log(err);
    } else {
      sns.unsubscribe({
        SubscriptionArn: sub.SubscriptionArn
      }, (err) => {
          if (err) {
              console.log(err);
          } else {
              res
                .status(200)
                .contentType("text/plain")
                .end(`${req.body.email} unsubscribed`);
          }
      });
    }
  })
});

app.get("/metadata", (req, res) => {
    sequelize
    .query(`SELECT * FROM images`, { logging: console.log, type: QueryTypes.SELECT })
    .then(data => {
      console.log(data)
      res
        .status(200)
        .contentType("text/plain")
        .end(JSON.stringify(data));
    })
});

app.get("/image", (req, res) => {
    sequelize
    .query(`SELECT * FROM images`, { logging: console.log, type: QueryTypes.SELECT })
    .then(metadata => {
      if(metadata.length === 0) res
        .status(200)
        .contentType("text/plain")
        .end("No images");
      const { name, uploaded } = metadata[Math.floor(Math.random() * metadata.length)];
      s3.getObject({
          Bucket: process.env.BUCKET_NAME,
          Key: name
      }, function(err, data) {
          if (err) console.log(err, err.stack);
          fs.writeFileSync(path.join(__dirname, `public/temp.png`), data.Body);
          res.sendFile(path.join(__dirname, `image.html`));
          res.render('image', { name, uploaded });
        });
    })
});
