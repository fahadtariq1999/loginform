const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const app = express();
const nodemailer = require('nodemailer');
const port = process.env.PORT || 5000


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.set('view engine', 'ejs');
app.set('views', 'views');




var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
  auth: {
    user: 'sladewilson184@gmail.com',
    pass: 'hngbqbsiukslgyro'
  }
});

// database connection for storing data
const connection = mysql.createConnection({
    host: 'eu-cdbr-west-03.cleardb.net',
    user: 'bec6bab80dbe37',
    password: 'ba0c27b1',
    database: 'heroku_02d50b9c7c5afca'
});

// cookie parser
app.use(cookieParser());

connection.connect();





app.get('/', (req, res) => {
    res.render('index');
});



// this is for registration
app.post('/', (req, res) => {

    // verification
    function Store(pass) {
        var verify = Math.floor((Math.random() * 10000000) + 1);

        var mailOption = {
            from :'sladewilson184@gmail.com', // sender this is your email here
            to : `${req.body.Email}`, // receiver email2
            subject: "Account Verification",
            html: `<h1>Clink on the link to verify your account<h1><br><hr>>
        <br><a href="http://localhost:3000/verification/?verify=${verify}">CLICK ME TO ACTIVATE YOUR ACCOUNT</a>`
        }
        // store data 

        var userData = { name:req.body.Name, email: req.body.Email, password: pass, verification: verify };
        connection.query("INSERT INTO verify SET ?", userData, (err, result) => {
            if (err) {
                console.log(err)
            } else {
                transporter.sendMail(mailOption,(error,info)=>{
                    if(error){

                        console.log(error)
                    }else{

                        let userdata = {
                            email : `${req.body.Email}`,
                        }
                        res.cookie("UserInfo",userdata);
                        res.send("Your Mail Send Successfully")
                    }
                })
                console.log('Data Successfully insert')
            }
        })

    }
    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(req.body.Password, salt, function (err, hash) {
            if (err) {
                console.log(err);
            } else {
                Store(hash);
            }
        });
    });
})

// verification 
app.get('/verification/',(req,res)=>{
    //console.log("V")
    function activateAccount(verification) {
        console.warn(req.query.verify);
        if(verification == req.query.verify){
           // console.log(verification);
            connection.query("UPDATE verify SET active = ?","true",(err,result)=>{
                if(err){
                    console.log(err);
                }
                else{
                    let userdata = {
                        email : `${req.body.Email}`,
                        verify: "TRUE"
                    }
                    res.cookie("UserInfo",userdata);
                    res.send('<h1>Account Verification Successfully</h1>');
                }
            })
        }else{
            res.send("<h1>verification failed</h1>")
        }
    };

    connection.query("SELECT verify.verification FROM verify WHERE email = ?",req.cookies.UserInfo.email,(err,result) => {
        if(err){
            console.log(err);
        }else{

            //console.log(result[0].verification);
            activateAccount(result[0].verification);
            /* var verify1 = req.query.verify;
            var verify2 = result[0].verification; 
            if(verify1 == verify2) {
                activateAccount(result[0].verification);
            }else{
                res.send("<h1>verification fail</h1>")
            } */
        }
    })
});

app.get('/dashboard',(req,res)=>{
    res.render('dashboard');
});

app.get('/login',(req,res)=>{
    res.render('login');
});

app.post('/login',(req,res)=>{
    var email = req.body.Email;
    var pass = req.body.Password;

    function LoginSuccess() {
        let userdata = {
            email : `${req.body.Email}`,
            verify: "TRUE"
        }
        res.cookie("UserInfo",userdata);
        res.json({verify: "true"});
    }
    connection.query('SELECT * FROM verify WHERE email = ?',email,(err,result)=>{
        if(err){
            console.log(err);
        }else{
            var hash = result[0].password;
            bcrypt.compare(pass, hash, function(err, res) {
                if(err){
                    res.json({msg:"ERROR"})
                }else{
                    LoginSuccess();
                }
            });
        }
    })
})

app.listen(port);
