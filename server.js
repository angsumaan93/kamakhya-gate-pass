const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const multer = require('multer'); 
const path = require('path'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); 
const { hashPassword, comparePassword } = require('./helper/auth');
const dotenv = require('dotenv');
dotenv.config();
const { sendMail, generateOTP } = require('./helper/mail');


const PORT = process.env.PORT;

const salt = 10;


const privateKey = "ticnnqeru58285vrgin5vklrwm9i3i-,f1";

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({
    storage: storage
});

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "kamakhya"
});

app.post('/signup', async (req, res) => {
  try {
      const { name, number, email, password} = req.body;

      // Check if required fields are provided
      if (!name || !number || !email || !password) {
          return res.status(400).json({ error: "All fields are required" });
      }

      const userData = await new Promise((resolve, reject) => {
        const sql = "SELECT * FROM login WHERE email = ? AND status = ?";
        db.query(sql, [email, 1], (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });


    if (userData.length !== 0) {
        return res.status(401).json({ success: false, message: "Email already exists" });
    }


      await new Promise((resolve, reject) => {
        db.query("DELETE FROM login WHERE email = ? AND status = 0", [email], (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
      });
      
      const hash = await hashPassword(password);
      const otp = generateOTP();

      await new Promise((resolve, reject) => {
          db.query(
              "INSERT INTO login(name, number, email, password, otp) VALUES (?, ?, ?, ?, ?)",
              [name, number, email, hash, otp],
              (err, result) => {
                  if (err) reject(err);
                  else resolve(result);
              }
          );
      });

      await sendMail(email, "Verification Code" , `<h1>${otp}</h1>`)

      return res.status(200).json({ message: "Check your email and verify otp" });

  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/verify', async (req, res)=>{
    try {
        const { email, otp} = req.body;
  
        // Check if required fields are provided
        if ( !email || !otp) {
            return res.status(400).json({ error: "All fields are required" });
        }
  
        const userData = await new Promise((resolve, reject) => {
            const sql = "SELECT * FROM login WHERE email = ?";
            db.query(sql, [email], (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
      
        if(!userData.length || userData[0]?.otp !== otp){
            return res.status(401).json({ message: "verification failed" });
        }

        await new Promise((resolve, reject) => {
            db.query(
                "UPDATE login SET status = ? WHERE email = ?",
                [1, email],
                (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                }
            );
        });
        
  
        return res.status(200).json({ message: "Successfully created account now you can login" });
  
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
});





app.get('/admin', (req, res) => {
    const sql = 'SELECT * FROM application';
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(result);
    });
});


app.get('/deva', (req, res) => {
    const sql = 'SELECT * FROM application';
    db.query(sql, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(result);
    });
});


app.put('/update-pass/:id', (req, res) => {
    const passId = req.params.id;
    const {
        name,
        person1,
        age1,
        person2,
        age2,
        person3,
        age3,
        person4,
        age4,
        visiting_date,
        fee
    } = req.body;

    const sql = `UPDATE application 
                 SET name = ?, person1 = ?, age1 = ?, person2 = ?, age2 = ?, person3 = ?, age3 = ?, person4 = ?, age4 = ?, visiting_date = ?,fee=?
                 WHERE id = ?`;

    const values = [
        name,
        person1,
        age1,
        person2,
        age2,
        person3,
        age3,
        person4,
        age4,
        visiting_date,
        fee,
        passId
    ];

    // Execute the query
    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error updating pass:', err);
            return res.status(500).send('An error occurred while updating the pass.');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Pass not found.');
        }
        res.status(200).send('Pass updated successfully.');
    });
});
app.put('/update-fee/:id', (req, res) => {
    const applicationId = req.params.id;
    const { fee } = req.body; // Assuming fee is a string representing the fee type ('free', 'paid')

    // Construct SQL query to update fee in application table
    const sql = `UPDATE application SET fee = ? WHERE id = ?`;
    const values = [fee, applicationId];

    // Execute the SQL query
    db.query(sql, values, (err, results) => {
        if (err) {
            console.error('Error updating fee:', err);
            return res.status(500).send('An error occurred while updating fee configuration.');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Application not found.');
        }
        res.status(200).send('Fee configuration saved successfully.');
    });
});

app.get('/reject/:id', (req, res) => {
    const sql = "update application set status=2 WHERE id = ?";
    const id = req.params.id;
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json(result);
    });
});

app.delete('/delete/:id', (req, res) => {
    const sql = "delete FROM application WHERE id = ?";
    const id = req.params.id;

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json({ message: 'Application deleted successfully' });
    });
});
app.get('/approve/:id', (req, res) => {
    const sql = "update application set status=1 WHERE id = ?";
    const id = req.params.id;
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json(result);
    });
});



// Endpoint to get pass count for a visiting date and time slot
app.get('/passCount', async (req, res) => {
    const { visitingDate, timeslot } = req.query; // Assuming visitingDate and timeslot are sent as query parameters
    console.log(req.query)
    try {
      const sql = "SELECT COUNT(*) AS passCount FROM application WHERE visiting_Date = ? AND timeslot = ?";
      db.query(sql, [visitingDate, timeslot], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        return res.json({passCount:result[0].passCount}); // Return the passCount directly
      });
    } catch (error) {
        console.log(error)
      res.status(500).json({ message: error.message });
    }
  });
  
  
  





app.post('/login', async (req, res) => {
    console.log(req.body);
  try {
    const { email, password } = req.body;

    // Sanitize inputs if necessary

    const userData = await new Promise((resolve, reject) => {
        const sql = "SELECT * FROM login WHERE email = ?";
        db.query(sql, [email], (err, data) => {
            if (err) reject(err);
            else resolve(data);
        });
    });

    console.log(userData[0].status)

    if (userData.length === 0) {
        return res.status(401).json({ success: false, message: "Email or password is incorrect" });
    }

    if(userData[0].status == 0){
        return res.status(401).json({ success: false, message: "Email is not verified yet" });
    }

    const isVerified = await comparePassword(password, userData[0].password);
    console.log(isVerified)

    if (isVerified) {
        const token = jwt.sign({ id: userData[0].id }, privateKey); 
        return res.status(200).json({ success: true, message: "Login successful", token });
    } else {
        return res.status(401).json({ success: false, message: "Email or password is incorrect" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Login failed" });
  }
});






app.post('/upload', upload.single('image'), (req, res) => { 
    try{
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        console.log(req.file);
        return res.status(200).json({ message: "File uploaded successfully", path: req.file.path });
    }
    catch(error){
        console.log(error)
    }
    
});



app.post('/main', (req, res) => {
    try {
       
        const sql = "INSERT INTO application(name,image1,image2,image3,designation,person1,age1,person2,age2,person3,age3,person4,age4,visiting_date,user,passtype,timeslot,district,state ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)";
        const values = [
            req.body.name,
            req.body.idcard,
            req.body.photo,
            req.body.reference,
            req.body.designation,
            req.body.person1,
            req.body.age1,
            req.body.person2,
            req.body.age2,
            req.body.person3,
            req.body.age3,
            req.body.person4,
            req.body.age4,
            req.body.visiting_date,
            req.body.user,
            req.body.passtype,
            req.body.timeslot,
            req.body.state,
            req.body.district,
        
            
        ];
        db.query(sql, values, (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            return res.status(200).json({ message: "Application successful" });
        });
    } catch (error) {
        console.log(error)
    }
    
});                

app.get('/user', (req,res)=>{
    try {
        const token = req.headers.authorization;
    const decoded = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );
    const id = decoded.id;
    const sql = "SELECT * FROM login WHERE id = ?";
    
    db.query(sql, [id], (err, data) => {
        if (err) {
            return res.status(500).json({success: false, message: "Internal error"});
        }
        if (data.length > 0) {
            return res.status(200).json({success: true, user: data[0]});
        } else {
            return res.status(500).json({success: false, message: "Internal error"});
        }
    });
        
    } catch (error) {
        return res.status(500).json({success: false, message: "Internal error"});
    }
    

})

app.get('/applications/:user', (req,res)=>{
    try {
       
    console.log(req.params)
    const sql = "SELECT * FROM application WHERE user = ?";
    db.query(sql, [req.params.user], (err, data) => {
        if (err) {
            return res.status(500).json({success: false, message: "Internal error"});
        }
        if (data.length > 0) {
            console.log(data)
            return res.status(200).json({success: true, applications: data});
        } else {
            return res.status(500).json({success: false, message: "Internal error"});
        }
    });
        
    } catch (error) {
        console.log(error)
        return res.status(500).json({success: false, message: "Internal error"});
    }
    

})




console.log(path.join(__dirname, './public/images'))
app.use( express.static(path.join(__dirname, './')))

app.listen(PORT || 8000, () => {
    console.log(`listening on port ${PORT}`);
});