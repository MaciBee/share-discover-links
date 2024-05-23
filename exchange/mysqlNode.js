//oldMysql 4.25.24

//simple way to connect mysql and node.js
// - works. but i need to integrate express. this is code w/o express 4/25/24

//mysql**

// Load environment variables from .env file** can find it in root@zen nano .env 

// code starts below . ps dotenv has all the password stuff 
//require(**'dotenv'**).config();

//let mysql = require(**'mysql2'**);

//let connection = mysql.createConnection({

//host: process.env.DB_HOST,

//port: process.env.DB_PORT,

//user: process.env.DB_USER,

//password: process.env.DB_PASSWORD,

//database: process.env.DB_NAME

});

// Connect to the MySQL server**

//connection.connect((err) => {

//**if** (err) return console.error(**'Connection error: '** + err.message);

  SQL statement to create a "tips" table**

const createTipsTable = `

CREATE TABLE IF NOT EXISTS tips (

id INT AUTO_INCREMENT PRIMARY KEY,

title VARCHAR(255) NOT NULL,

description TEXT NOT NULL,

category VARCHAR(100),

author VARCHAR(100),

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

);

`;

 * Execute the query to create the table**

connection.query(createTipsTable, (err, results, fields) => {

**if** (err) {

console.error(**'Error creating table: '** + err.message);

return;

}

console.log(**'Tips table created or already exists'**);

});

 *//* Close the connection**

connection.end((err) => {

**if** (err) console.error(**'Error closing connection: '** + err.message);

});

});
*/
