const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const { Sequelize, QueryTypes } = require('sequelize');
const config = require('./config/config.json');

const port = 3000;

const sequelize = new Sequelize(config.development);

app.set("view engine", "hbs");
// app.engine('html', require('hbs').__express);
app.set("views", "views");

app.use("/assets", express.static("assets")); //Akses file statis
app.use(express.urlencoded({ extended: true }));

app.get('/', renderHome);
app.get('/login', renderLogin);
app.get('/register', renderRegister);

app.post('/register', register);

// Function Render 
function renderHome(req, res) {
    res.render('home');
};

function renderLogin(req, res) {
    res.render('login');
};

async function renderRegister(req, res) {
    res.render('register');
};

// Function logic
function register(res, req) {
    console.log(req);
    // try {
    //     console.log(req.body);

    //     // const { email, username, password } = req.body;

    //     // const hashedPassword = await bcrypt.hash(password, 10);

    //     // const query = `INSERT INTO users_tb ( email, username, password ) 
    //     //                 VALUES ('${email}','${username}','${hashedPassword}')`;

    //     // await sequelize.query(query, { type: QueryTypes.INSERT });
    
    //     res.redirect('/login');
    // } catch (error) {
    //     console.log(error);
    // }
}


app.listen(port, () => {
    console.log(`Aplikasi berjalan pada port ${port}`);
})