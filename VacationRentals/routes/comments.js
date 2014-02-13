module.exports = { init: configureRoutes }

var habitations = require('../model/habitationsDb');


function configureRoutes(app) {
    app.post('/habitation/:id/comment/?', processComment); // Processamento da adição de apreciação (utilizando Ajax)
}

function commentForm(req, res) {
    res.send("<h1>Comment form</h1>");
}

function processComment(req, res) {
	var name=req.body.name;
	var stars=req.body.stars;
	var cmt=req.body.comment;

	if (!(cmt && stars && name))
	{
		res.send(400);
	}
	else {
		var now = new Date();

		var cmt = {
          "points": stars,
          "comment": cmt,
          "date": require('dateformat')("yyyy-mm-dd"),
          "author": name
        };

       habitations.addNewComment(req.params["id"],cmt,function(err,data){
       	if (err){
       		res.send(400);
       	}
       	else {
       		res.writeHead(200, {"Content-Type": "application/json"});
       		res.end(JSON.stringify(cmt));
       	}
       });
    }

}
