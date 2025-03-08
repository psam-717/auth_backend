require('dotenv').config()
const express = require('express');
const app = express();
const port = 5000;
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose')
const authRouter = require('./routers/auth.router')
const homeRouter = require('./routers/home.router');
const morgan = require('morgan');
const generateVerificationCode = require('./utils/verification.code');

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(cors());
app.use(helmet());
app.use(cookieParser());

app.use(morgan('dev'))

//connecting to database
mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('✅ Database connected')
}).catch(err =>{
    console.log(err)
})

app.use('/api/auth', authRouter)
app.use('/', homeRouter)
// const verCode = generateVerificationCode(6);
// console.log(verCode)

app.listen(port, ()=>{
    console.log(`🟢 Server is listening on port ${port}`)
})