const express = require('express');
const app = express();
const port = 3000;

app.set("view engine", "hbs");
// app.engine('html', require('hbs').__express);
app.set("views", "views");

app.use("/assets", express.static("assets"))

app.get('/', renderHome);
app.get('/login', renderLogin);
app.get('/register', renderRegister);

// Function Render 
function renderHome(req, res) {
    res.render('home');
};

function renderLogin(req, res) {
    res.render('login');
};

function renderRegister(req, res) {
    res.render('register');
};

app.listen(port, () => {
    console.log(`Aplikasi berjalan pada port ${port}`);
})