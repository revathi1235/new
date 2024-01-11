const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bodyparser = require('body-parser')
const userModel = require('./models/User');
const departmentModel=require('./models/Departments');
 const departmentheadsModel =require('./models/DepartmentHeads')
const empModel=require('./models/Employees')
const multer = require('multer');
const path = require('path');

const PORT = 5000;

const app = express();

// Middlewares
app.use(cors({
    origin: ["http://localhost:3000"],
    methods:'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    cacheControl: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));
app.use(bodyparser.json());


const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json("token is missing");
    } else {
        jwt.verify(token, "jwt-secret-key", (err, decoded) => {
            if (err) {
                res.json("error with token");
            } else {
                if (decoded.role === "admin") {
                    next();
                } else {
                    return res.json("not admin");
                }
            }
        });
    }
};


// Connect to MongoDB server


  mongoose.connect("mongodb://127.0.0.1:27017/hospital")
    .then(() => console.log("db connected"))
    .catch(err => console.log(err));


// Register API

app.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    bcrypt.hash(password, 10)
        .then(hash => {
            userModel.create({ name, email, password: hash })
                .then(user => res.json("success"))
                .catch(err => res.json(err));
        })
        .catch(err => res.json(err));
});


// Login API

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    userModel.findOne({ email: email })
        .then(user => {
            if (user) {
                bcrypt.compare(password, user.password, (err, response) => {
                    if (response) {
                        const token = jwt.sign({ email: user.email, role: user.role }, "jwt-secret-key", { expiresIn: "1d" });
                        res.cookie("token", token);
                        return res.json({ status: "success", role: user.role });
                    } else {
                        return res.json("password is incorrect");
                    }
                });
            } else {
                return res.json("no record existed");
            }
        });
});


// Dashboard API

app.get('/dashboard', verifyUser, (req, res) => {
    res.json("success");
});

const storage =multer.diskStorage({
    destination:(req,file,cb)=> {
        cb(null,'public/images')
    },
    filename:(req,file,cb)=> {
        cb(null,file.fieldname + "_" + Date.now() + path.extname(file.originalname))
    }
})

const upload=multer({
    storage:storage
})

  //creating Departments

  app.post('/showDepartment',upload.single('file'),(req,res)=> {
    const { name, year, description } = req.body;
    const image = req.file.filename;
    departmentModel.create({
        name: name,
        image: image,
        year: year,
        description: description
     })
     .then(result =>res.json(result))
     .catch(err =>console.log(err))
  })


   //get all departments on department.js  and used in createHead.js for getting all department as a dropdown
app.get('/getDepartment', (req, res) => {
    departmentModel.find()
    .then(result => res.json(result))
    .catch(err => res.json(err))
  })

  app.get('/getdepartmentDetails/:id', (req, res) => {
    const { id } = req.params;
    departmentModel.findOne({ _id: id })
      .then(result => res.json(result))
      .catch(err => res.json(err));
  });
  
  
 //get for update Department  details to edit
app.get('/getDepartment/:id', (req, res) => {
    const id = req.params.id;
    departmentModel.findById({ _id: id })
      .then(result => res.json(result))
      .catch((err) => console.log(err));
  });
  
    //update department with provided data
    app.put('/updateDepartment/:id', upload.single('file'), (req, res) => {
        const id = req.params.id;
        const { name, year, description } = req.body;
    
        let updateFields = {
            name: name,
            year: year,
            description: description
        };
    
        if (req.file) {
            updateFields.image = req.file.filename;
        }
    
        departmentModel.findByIdAndUpdate({ _id: id }, updateFields, { new: true })
            .then(result => res.json(result))
            .catch(err => res.json(err));
    });
    

    //Delete department 

    app.delete('/deleteDepartment/:id',(req,res)=> {
        const id=req.params.id
        departmentModel.findByIdAndDelete({_id:id})
        .then(result =>res.json(result))
        .catch(err =>res.json(err))
    })

    //get profile dep
    app.get('/getdepartmentDetails/:id', (req, res) => {
      const { id } = req.params;
      console.log('Received request for department details with id:', id);
      departmentModel.findOne({ _id: id })
        .then(result => {
          console.log('Found department details:', result);
          res.json(result);
        })
        .catch(err => {
          console.log('Error:', err);
          res.status(500).json({ error: 'Internal Server Error' });
        });
    });
    
    



    // receiving department heads details from client
    app.post('/createHead', upload.single('file'), (req, res) => {
        try {
          const { name, age, number, description, deptName } = req.body;
          const image = req.file ? req.file.filename : null; // Check if a file was uploaded
      
          // Validate required fields
          if (!name || !age || !number || !description || !deptName) {
            return res.status(400).json({ error: 'All fields are required' });
          }
      
          departmentheadsModel.create({
            name: name,
            age: age,
            number: number,
            description: description,
            department: deptName,
            image: image,
          })
            .then(result => res.json(result))
            .catch(err => {
              console.error(err);
              res.status(500).json({ error: 'Internal Server Error' });
            });
        } catch (error) {
          console.error(error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      });
      
    
      //getting all details of department heads mail page depatmentHeads

      app.get('/getDepartmentHeads', (req, res) => {
        departmentheadsModel.find()
          .then(result => res.json(result))
          .catch(err => res.json(err))
      });
      
      
     // geting details on updatehead
    //   app.get('/getHead/:id',(req,res)=> {
    //     const id=req.params.id
    //     departmentheadsModel.findById({_id:id})
    //     .then(result =>res.json(result))
    //     .catch(err =>res.json(err))
    //   })
    app.get('/getDepartmentHeads/:id', (req, res) => {
      const id = req.params.id;
    
      departmentheadsModel.findById({ _id: id })
        .then(result => {
          if (!result) {
            return res.status(404).json({ error: 'Head not found' });
          }
          res.json(result);
        })
        .catch(err => {
          console.error(err);
          res.status(500).json({ error: 'Internal Server Error' });
        });
    });
    



    //updating heads details 

    app.put('/updateDepartmentHeads/:id', upload.single('file'), async (req, res) => {
      const id = req.params.id;
      const { name, age, number, description, department } = req.body;
    
      try {
        const updatedFields = {
          name,
          age,
          number,
          description,
          department,
        };
    
        if (req.file) {
          // Delete the existing file (if any) before updating
          const existingHead = await departmentheadsModel.findById({ _id: id });
          if (existingHead && existingHead.image) {
            const imagePath = path.join(__dirname, 'your-upload-folder', existingHead.image);
            fs.unlinkSync(imagePath);
          }
    
          updatedFields.image = req.file.filename;
        }
    
        const updatedHead = await departmentheadsModel.findByIdAndUpdate({ _id: id }, updatedFields, { new: true });
    
        if (!updatedHead) {
          return res.status(404).json({ error: 'Head not found' });
        }
    
        res.json(updatedHead);
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
    
      
   
      
      //delete department heads

      app.delete('/deleteHead/:id',(req,res)=> {
        const id=req.params.id
        departmentheadsModel.findByIdAndDelete({_id:id})
        .then(result =>res.json(result))
        .catch(err =>res.json(err))
      })
  

      //employee page
       //create employee page sending data from user to server

      app.post('/createEmployee',upload.single('file'),(req,res)=> {
        const {name,age,number,description,department,departmentHead}=req.body
        const image=req.file.filename
        empModel.create({
            name:name,
            age:age,
            number:number,
            description:description,
            department:department,
            departmentHead:departmentHead,
            image:image
        })
        .then(result =>res.json(result))
        .catch(err =>res.json(err))

      })

      //sending data from server to client 

      app.get('/getEmployee',(req,res)=> {
        empModel.find()
        .then(result =>res.json(result))
        .catch(err =>res.json(err))
      })


      //update employee
       //first step get data by id
 
       app.get('/getEmployee/:id',(req,res)=> {
         const id=req.params.id
         empModel.findById({_id:id})
         .then(result =>res.json(result))
         .catch(err =>res.json(err))
       })


         //second step update by id
         app.put('/updateEmployee/:id', upload.single('file'), (req, res) => {
            const id = req.params.id;
            const { name, age, number, description, department,departmentHead } = req.body;
            let updateFields = {
              name: name,
              age: age,
              number: number,
              description: description,
              department: department,
              departmentHead:departmentHead
            };  
            if (req.file) {
              updateFields.image = req.file.filename;
            }
          
            empModel.findByIdAndUpdate({ _id: id }, updateFields, { new: true })
              .then(result => res.json(result))
              .catch(err => res.json(err));
          });

          //delete employee

          app.delete('/deleteEmployee/:id',(req,res)=> {
            const id=req.params.id
            empModel.findByIdAndDelete({_id:id})
            .then(result =>res.json(result))
            .catch(err =>res.json(err))
          })
          




//server running

app.listen(PORT, () => console.log("server is running on port number: " + PORT));





