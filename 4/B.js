const express = require('express');
const app = express();
const port = 3000;

app.set("view engine", "hbs");
// app.engine('html', require('hbs').__express)
app.set("views", "views");

app.get('/', (req, res) => {
    res.render('home', {
        name : "oke"
    });
});

app.listen(port, () => {
    console.log(`Aplikasi berjalan pada port ${port}`);
})