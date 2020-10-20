
const { Sequelize, QueryTypes } = require('sequelize');

require('dotenv').config()

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_LOGIN, process.env.DB_PASSWORD, {
  host     : process.env.DB_HOST,
  dialect  : process.env.DB_DIALECT
});

sequelize.query(`DROP TABLE images`, { logging: console.log })

sequelize.query(`CREATE TABLE images (
      id MEDIUMINT NOT NULL AUTO_INCREMENT,
      name CHAR(30) NOT NULL,
      upload_date CHAR(30) NOT NULL,
      PRIMARY KEY (id)
  );`, { logging: console.log })

sequelize
.query(`SELECT * FROM images`, { logging: console.log, type: QueryTypes.SELECT })
.then(data => {
  console.log(data)
})

// connection.connect(function(err) {
//   if (err) {
//     console.error('Database connection failed: ' + err.stack);
//     return;
//   }

//   console.log('Connected to database.');

// //   connection.query(`CREATE TABLE images (
// //     id MEDIUMINT NOT NULL AUTO_INCREMENT,
// //     name CHAR(30) NOT NULL,
// //     upload_date CHAR(30) NOT NULL,
// //     PRIMARY KEY (id)
// // );`)

// connection.query(`SELECT * FROM images`, (err, data) => console.log(data))

// connection.end();
// });
