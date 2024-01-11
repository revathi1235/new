const mongoose=require('mongoose')

const empSchema= new mongoose.Schema({
    name:String,
    age:Number,
    number:Number,
    description:String,
    department:String,
    departmentHead:String,
    image:String
})

const empModel=mongoose.model("employee",empSchema)

module.exports=empModel