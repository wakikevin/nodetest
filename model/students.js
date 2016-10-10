//create a users object
var mongoose = require('mongoose');

//create the schema details
var studentSchema = new mongoose.Schema({
	name:String,
	phone:Number,
	email:String,
	dob: {type:Date , default: Date.now()},
	isActive:Boolean
});

//create model for the schema
mongoose.model('Student', studentSchema);