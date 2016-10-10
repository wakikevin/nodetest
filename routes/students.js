//create a students route --to avoid using index.js
var express = require('express'),
	router = express.Router(),
	mongoose = require('mongoose'), //mongodb connection
	bodyParser = require('body-parser'), //used to parse POST requests
	methodOverride = require('method-override'); //used to manipulate POST data

//create the request process and CRUD operations
router.use(bodyParser.urlencoded({extended:true}))
router.use(methodOverride(function(req, res){
	if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and delete it
        var method = req.body._method
        delete req.body._method
        return method
      }
}))

//the crud methods
//build the REST operations at the base for students
//this will be accessible from http://127.0.0.1:3000/students if the default route for / is left unchanged
router.route('/')
    //GET all students
    .get(function(req, res, next) {
        //retrieve all students from Monogo
        mongoose.model('Student').find({}, function (err, students) {
              if (err) {
                  return console.error(err);
              } else {
                  //respond to both HTML and JSON. JSON responses require 'Accept: application/json;' in the Request Header
                  res.format({
                      //HTML response will render the index.jade file in the views/students folder. We are also setting "students" to be an accessible variable in our jade view
                    html: function(){
                        res.render('students/index', {
                              title: 'All Enrolled Students',
                              "students" : students
                          });
                    },
                    //JSON response will show all students in JSON format
                    json: function(){
                        res.json(students);
                    }
                });
              }     
        });
    })
    //POST a new student
    .post(function(req, res) {
        // Get values from POST request. These can be done through forms or REST calls. These rely on the "name" attributes for forms
        var name = req.body.name;
        var phone = req.body.phone;
        var dob = req.body.dob;
        var email = req.body.email;
        var isActive = req.body.isActive;
        //call the create function for our database
        mongoose.model('Student').create({
            name : name,
            phone : phone,
            dob : dob,
            email:email,
            isActive : isActive
        }, function (err, student) {
              if (err) {
                  res.send("There was a problem adding the information to the database.");
              } else {
                  //Blob has been created
                  console.log('POST creating new student: ' + student);
                  res.format({
                      //HTML response will set the location and redirect back to the home page. You could also create a 'success' page if that's your thing
                    html: function(){
                        // If it worked, set the header so the address bar doesn't still say /adduser
                        res.location("students");
                        // And forward to success page
                        res.redirect("/students");
                    },
                    //JSON response will show the newly created student
                    json: function(){
                        res.json(student);
                    }
                });
              }
        })
    });

/* GET New Student page. */
router.get('/new', function(req, res) {
    res.render('students/new', { title: 'Add New Student' });
});

// route middleware to validate :id
router.param('id', function(req, res, next, id) {
    console.log('validating ' + id + ' exists');
    //find the ID in the Database
    mongoose.model('Student').findById(id, function (err, student) {
        //if it isn't found, we are going to repond with 404
        if (err) {
            console.log(id + ' was not found');
            res.status(404)
            var err = new Error('Not Found');
            err.status = 404;
            res.format({
                html: function(){
                    next(err);
                 },
                json: function(){
                       res.json({message : err.status  + ' ' + err});
                 }
            });
        //if it is found we continue on
        } else {
            //uncomment this next line if you want to see every JSON document response for every GET/PUT/DELETE call
            //console.log(student);
            // once validation is done save the new item in the req
            req.id = id;
            // go to the next thing
            next(); 
        } 
    });
});

//get a single student and display his details
router.route('/:id')
  .get(function(req, res) {
    mongoose.model('Student').findById(req.id, function (err, student) {
      if (err) {
        console.log('GET Error: There was a problem retrieving: ' + err);
      } else {
        console.log('GET Retrieving ID: ' + student._id);
        var studentdob = student.dob.toISOString();
        studentdob = studentdob.substring(0, studentdob.indexOf('T'))
        res.format({
          html: function(){
              res.render('students/show', {
                "studentdob" : studentdob,
                "student" : student
              });
          },
          json: function(){
              res.json(student);
          }
        });
      }
    });
  });

//GET the individual blob by Mongo ID
router.get('/:id/edit', function(req, res) {
    //search for the blob within Mongo
    mongoose.model('Student').findById(req.id, function (err, student) {
        if (err) {
            console.log('GET Error: There was a problem retrieving: ' + err);
        } else {
            //Return the blob
            console.log('GET Retrieving ID: ' + student._id);
            //format the date properly for the value to show correctly in our edit form
          var studentdob = student.dob.toISOString();
          studentdob = studentdob.substring(0, studentdob.indexOf('T'))
            res.format({
                //HTML response will render the 'edit.jade' template
                html: function(){
                       res.render('students/edit', {
                          title: 'Student' + student._id,
                          "studentdob" : studentdob,
                          "student" : student
                      });
                 },
                 //JSON response will return the JSON output
                json: function(){
                       res.json(student);
                 }
            });
        }
    });
});

//PUT to update a blob by ID
router.put('/:id/edit', function(req, res) {
    // Get our REST or form values. These rely on the "name" attributes
    var name = req.body.name;
    var phone = req.body.phone;
    var dob = req.body.dob;
    var email = req.body.email;
    var isActive = req.body.isActive;

   //find the document by ID
    mongoose.model('Student').findById(req.id, function (err, student) {
            //update it
            student.update({
                name : name,
                phone : phone,
                dob : dob,
                email : email,
                isActive : isActive
            }, function (err, studentID) {
              if (err) {
                  res.send("There was a problem updating the information to the database: " + err);
              } 
              else {
                      //HTML responds by going back to the page or you can be fancy and create a new view that shows a success page.
                      res.format({
                          html: function(){
                               res.redirect("/students/" + student._id);
                         },
                         //JSON responds showing the updated values
                        json: function(){
                               res.json(student);
                         }
                      });
               }
            })
        });
});

//DELETE a Student by ID
router.delete('/:id/edit', function (req, res){
    //find student by ID
    mongoose.model('Student').findById(req.id, function (err, student) {
        if (err) {
            return console.error(err);
        } else {
            //remove it from Mongo
            student.remove(function (err, student) {
                if (err) {
                    return console.error(err);
                } else {
                    //Returning success messages saying it was deleted
                    console.log('DELETE removing ID: ' + student._id);
                    res.format({
                        //HTML returns us back to the main page, or you can create a success page
                          html: function(){
                               res.redirect("/students");
                         	},
	                         //JSON returns the item with the message that is has been deleted
	                        json: function(){
	                               res.json({message : 'deleted',
	                                   item : student
	                               });
	                         }
                      });
                }
            });
        }
    });
});

//export all routes
module.exports= router;