require('dotenv').config()
const mindee = require('mindee');
const path = require('path');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
// const pdfParse = require('pdf-parse');
const session = require('express-session');

const app = express();
const port = 3000;

// handle file uploads, storage on disk
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        return cb(null, 'uploads')
    },

    filename: function (req, file, cb) {
        return cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    },
})

// define upload
const upload = multer({ storage: storage })

// set view engine
app.set('view engine', 'ejs');
app.set('views', path.resolve("./views"));

// middleware to parse form data
app.use(express.urlencoded({ extended: false }));

// set session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false }
}))

// routes
app.get('/', (req, res) => {
    return res.render('homepage')
})

app.post('/upload', upload.single('invoice'), async (req, res) => {
    console.log(req.body);
    console.log(req.file);

    const invoicePath = req.file.path;
    console.log(invoicePath);

    // Init a new client
    const mindeeClient = new mindee.Client({ apiKey: process.env.MINDEE_API_KEY });

    // Load a file from disk
    const inputSource = mindeeClient.docFromPath(invoicePath);

    // Parse the file
    const apiResponse = mindeeClient.parse(
        mindee.product.InvoiceV4,
        inputSource
    );

    // Handle the response Promise
    apiResponse.then((resp) => {
        // print a string summary of the document
        // console.log(resp.document.toString());

        // send this data to invoice page
        req.session.parsedData = resp.document;


        console.log('req.session.parsedData: ', req.session.parsedData);

        return res.render('invoice', { parsedData: resp.document });

    });

    // return res.redirect('/invoice');
})

app.get('/invoice', (req, res) => {
    return res.render('invoice', { parsedData: req.session.parsedData })
})

// server
app.listen(port, () => console.log(`App listening on port ${port}!`));