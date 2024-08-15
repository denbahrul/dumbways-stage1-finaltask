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
app.get('/hero-detail/:hero_id', renderDetail);
app.get('/edit-hero/:hero_id', renderEditHero);
app.get('/edit-type/:type_id', renderEditType);

app.post('/register', register);
app.post('/login', login);
app.post('/add-hero', upload.single('photo'), addHero);
app.post('/add-type', addType);
app.post('/edit-hero/:hero_id', upload.single('photo'), editHero);
app.post('/edit-type/:type_id', editType);

app.get('/logout', logout);
app.get('/delete/:hero_id', deleteHero);
app.get('/delete-type/:type_id', deleteType);

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

async function renderAddType(req, res) {
    try {
        const { isLogin, user } = req.session;

        const query = `SELECT * FROM type_tb`;
        const heroType = await sequelize.query(query, {type: QueryTypes.SELECT});

        isLogin ? res.render('add-type', { isLogin, user, data: heroType }) : res.redirect('/login'); 
    } catch (error) {
        console.log(error);
    }
};

async function renderDetail(req, res) {
    try {
        const id = req.params.hero_id;
        const { isLogin, user } = req.session;

        const query = `SELECT * FROM heroes_tb WHERE id=${id}`;
        const hero = await sequelize.query(query, { type: QueryTypes.SELECT});

        res.render("hero-detail", {
            data: hero[0],
            isLogin,
            user
        })

    } catch (error) {
        console.log(error);
    }
}

async function renderEditHero(req, res) {
    const { isLogin, user} = req.session;
    const id = req.params.hero_id;

    const query = `SELECT * FROM type_tb`;
    const heroType = await sequelize.query(query, {type: QueryTypes.SELECT});

    const selectHero = `SELECT * FROM heroes_tb WHERE id='${id}'`;
    const hero = await sequelize.query(selectHero, {type: QueryTypes.SELECT});

    isLogin ? res.render('edit-hero', { isLogin, user, type: heroType, data: hero[0] }) : res.redirect('/login') ;
};

async function renderEditType(req, res) {
    const { isLogin, user} = req.session;
    const id = req.params.type_id;

    const query = `SELECT * FROM type_tb WHERE id='${id}'`;
    const heroType = await sequelize.query(query, {type: QueryTypes.SELECT});

    isLogin ? res.render('edit-type', { isLogin, user, data: heroType[0]}) : res.redirect('/login') ;
};

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

        const query = `INSERT INTO type_tb (name) VALUES ('${name}')`;
        
        await sequelize.query(query, {type: QueryTypes.INSERT});
        
        res.redirect('/add-type');
    } catch (error) {
        console.log(error);
    }
};

async function editHero(req, res) {
    try {
        const { heroName, heroType } = req.body;
        const photo = req.file.filename;

        const id = req.params.hero_id;
        console.log(req.file);

        const query = `UPDATE heroes_tb
                        SET name = '${heroName}', type_id = '${heroType}', photo = '${photo}'
                        WHERE id=${id}`
    
        await sequelize.query(query, {type: QueryTypes.UPDATE});
    
        res.redirect('/')
    } catch (error) {
        console.log(error);
    }
}

async function deleteHero(req, res) {
    try {
        const id = req.params.hero_id;

        const query = `DELETE FROM heroes_tb WHERE id=${id}`;

        await sequelize.query(query, {type: QueryTypes.DELETE});
    
        res.redirect('/');
    } catch (error) {
        console.log(error);
    }
}

async function editType(req, res) {
    try {
        const name = req.body.typeName;

        const id = req.params.type_id;

        const query = `UPDATE type_tb
                        SET name = '${name}'
                        WHERE id=${id}`
    
        await sequelize.query(query, {type: QueryTypes.UPDATE});
    
        res.redirect('/add-type')
    } catch (error) {
        console.log(error);
    }
}

async function deleteType(req, res) {
    try {
        const id = req.params.type_id;

        const query = `DELETE FROM type_tb WHERE id=${id}`;

        await sequelize.query(query, {type: QueryTypes.DELETE});
    
        res.redirect('/add-type');
    } catch (error) {
        console.log(error);
    }
}

app.listen(port, () => {
    console.log(`Aplikasi berjalan pada port ${port}`);
})