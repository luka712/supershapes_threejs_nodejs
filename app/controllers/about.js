


exports.about = (req,res) => {
    res.render('about', {
        username: req.session.user.name
    });
}