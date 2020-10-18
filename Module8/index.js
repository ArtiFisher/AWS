const http = require("http");
const path = require("path");
const fs = require("fs");
const AWS = require('aws-sdk');
const express = require("express");

require('dotenv').config()

const app = express();
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 3000;

AWS.config.update({region: 'eu-west-1'});

const s3 = new AWS.S3({apiVersion: '2006-03-01'});

httpServer.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

app.get("/", express.static(path.join(__dirname, "./public")));

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
            Key: `${Date.now()}.png`,
            Body: fs.readFileSync(tempPath)
        }, function(err, data) {
            if (err) {
                throw err;
            }
            console.log(`File uploaded successfully. ${data.Location}`);
            res
                .status(200)
                .contentType("text/plain")
                .end("File uploaded!");
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

app.get("/image", (req, res) => {
    s3.getObject({
        Bucket: process.env.BUCKET_NAME,
        Key: `1603012002315.png`
    }, function(err, data) {
        if (err) console.log(err, err.stack);

        fs.writeFileSync(path.join(__dirname, `./images/1603012002315.png`), data.Body);
        res.sendFile(path.join(__dirname, `./images/1603012002315.png`));

      });
});
