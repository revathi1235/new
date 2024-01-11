const mongoose=require('mongoose')

 const departmentheadSchema= new mongoose.Schema({
     name:String,
     image:String,
     age:Number,
     number:Number,
     description:String,
     department:String
 })

 const departmentheadsModel=mongoose.model("departmentHeads",departmentheadSchema)

 module.exports =departmentheadsModel
