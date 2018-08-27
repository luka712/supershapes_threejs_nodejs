var home = require('../app/controllers/home');
var model = require('../app/controllers/model');
var about = require('../app/controllers/about');

//you can include all your controllers

module.exports = function (app, passport) {

    app.get('/login', home.login);
    app.get('/signup', home.signup);
    app.get('/logout', home.logout);

    app.get('/', home.loggedIn, home.home);//home
    app.get('/home', home.loggedIn, home.home);//home

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/home', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));
    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/home', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // about
    app.get('/about', home.loggedIn, about.about);

    // model 
    app.get('/api/model', model.get);
    app.get('/api/model/:id', model.getById);
    app.post('/api/model', model.save);
    app.put('/api/model/:id', model.update);
    app.delete('/api/model/:id', model.delete);

}
