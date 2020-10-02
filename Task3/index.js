const AWS = require('aws-sdk')
const Csv = require('objects-to-csv')

var credentials = new AWS.SharedIniFileCredentials({profile: 's3reader'});
AWS.config.credentials = credentials;

function splitPath(path) {
  var result = path.replace(/\\/g, "/").match(/(.*\/)?(\..*?|.*?)(\.[^.]*?)?(#.*$|\?.*$|$)/);
  return {
    dirname: result[1] || "",
    filename: result[2] || "",
    extension: result[3] || "",
    params: result[4] || ""
  };
};

var s3 = new AWS.S3();

s3.listObjects({
  Bucket: "artsiom-rybakou-task1"
 }, (err, data) => {
  var csv = new Csv(data.Contents.map(({ Key }) => { 
    const {dirname, filename, extension} = splitPath(Key)
    return { path: dirname, name: filename + extension }
  }))

  csv.toDisk('./output.csv')

  console.log(csv.data);
});
