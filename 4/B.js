const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const session = require('express-session');
const { Sequelize, QueryTypes } = require('sequelize');
const config = require('./config/config.json');
const upload = require('./middlewares/uploadImage');

const port = 3000;

const sequelize = new Sequelize(config.development);

app.set("view engine", "hbs");
// app.engine('html', require('hbs').__express);
app.set("views", "views");

app.use("/assets", express.static("assets")); //Akses file statis
app.use("/upload-files", express.static("upload-files"))
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'ytta',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge:360000, secure: false },
}))

app.get('/', renderHome);
app.get('/login', renderLogin);
app.get('/register', renderRegister);
app.get('/add-hero', renderAddHero);
app.get('/add-type', renderAddType);

app.post('/register', register);
app.post('/login', login);
app.post('/add-hero', upload.single('photo'), addHero);
app.post('/add-type', addType);

app.get('/logout', logout);

// FUNCTION RENDER 
// auth
function renderLogin(req, res) {
    const isLogin = req.session.isLogin;

    isLogin ? res.redirect('/') : res.render('login');
};

function renderRegister(req, res) {
    const isLogin = req.session.isLogin;

    isLogin ? res.redirect('/') : res.render('register');
};

// crud
async function renderHome(req, res) {
    try {
        const query = `SELECT * FROM heroes_tb`;
        const heroes = await sequelize.query(query, {type : QueryTypes.SELECT});

        res.render('home', {
            isLogin: req.session.isLogin,
            data: heroes,
        });
    } catch (error) {
        console.log(error);
    }
};

async function renderAddHero(req, res) {
    const { isLogin, user} = req.session;

    const query = `SELECT * FROM type_tb`;
    const heroType = await sequelize.query(query, {type: QueryTypes.SELECT});

    isLogin ? res.render('add-hero', { isLogin, user, data: heroType}) : res.redirect('/login') ;
};

function renderAddType(req, res) {
    const { isLogin, user } = req.session;

    isLogin ? res.render('add-type', { isLogin, user }) : res.redirect('/login'); 
}

// FUNCTION LOGIC
//auth
async function register(req, res) {
    try {
        console.log(req.body);

        const { email, username, password } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const query = `INSERT INTO users_tb ( email, username, password ) 
                        VALUES ('${email}','${username}','${hashedPassword}')`;

        await sequelize.query(query, { type: QueryTypes.INSERT });
    
        res.redirect('/login');
    } catch (error) {
        console.log(error);
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        const query = `SELECT * FROM users_tb WHERE email = '${email}'`;
        const user = await sequelize.query(query, {type: QueryTypes.SELECT});

        console.log(user);

        if (user.length == 0) {
            console.log('Email belum terdaftar');
            return res.redirect('/login');
        } 
        
        const isPasswordValid = await bcrypt.compare(password, user[0].password);
        
        if (!isPasswordValid) {
            console.log('Password tidak sesuai');
            return res.redirect('/login');
        } 

        req.session.isLogin = true;    
        req.session.user = {
            id : user[0].id,
            username : user[0].username,
        };

        console.log(req.session.isLogin);

        console.log('Login Berhasil');
        res.redirect('/');
    }
    catch (error) {
        console.log(error);
    }
}

function logout(req, res) {
    req.session.destroy();
    res.redirect('/login')
}

//crud
async function addHero(req, res) {
    try {
        const { heroName, heroType } = req.body;
        const id = req.session.user.id;
        const photo = req.file.filename;
    
        const query = `INSERT INTO heroes_tb (name, type_id, photo, user_id)
                        VALUES ('${heroName}','${heroType}','${photo}','${id}')`;
    
        await sequelize.query(query, {type: QueryTypes.INSERT});
    
        res.redirect('/')
    } catch (error) {
        console.log(error);
    }
}

async function addType(req, res) {
    try {
        const name = req.body.typeName;

        console.log(req.body);

        const query = `INSERT INTO type_tb (name) VALUES ('${name}')`;
        
        await sequelize.query(query, {type: QueryTypes.INSERT});
        
        res.redirect('/');
    } catch (error) {
        console.log(error);
    }
}

app.listen(port, () => {
    console.log(`Aplikasi berjalan pada port ${port}`);
})