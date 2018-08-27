
var Model = require('../models/model');
var mongoose = require('mongoose');

exports.loggedIn = function (req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect('/login');
    }
}

exports.get = (req, res) => {
    var userId = req.session.user._id;
    Model.find({ user_id: userId }).limit(parseInt(req.query.pages) || 5)
        .exec((err, docs) => {
            if (err !== null) {
                throw new Error(err);
            }

            res.json(docs);
        });
}

exports.getById = (req, res) => {
    var id = req.params.id;
    Model.findById(id).exec((err, m) => {
        if (err !== null) {
            throw new Error(err);
        }

        res.json(m);
    });
}

exports.save = (req, res) => {
    var m = new Model();
    Object.assign(m, req.body);
    m._id = new mongoose.Types.ObjectId;
    m.user_id = req.session.user._id;
    m.created_date = new Date();
    m.updated_date = new Date();

    Model.find({ user_id: m.user_id }).exec((err, docs) => {
        if (err !== null) {
            throw new Error(err);
        }

        if (docs.length !== 0) {
            var name = m.name,
                index = 0,
                condition = true;

            while (condition) {
                name = `${m.name}${++index}`;
                condition = docs.some(e => {
                    return e.name === name;
                });
            }
            m.name = name;
        }

        m.save(err => {
            if (err !== null) {
                throw new Error(err);
            }
            res.json({
                id: m._id
            });
        });
    });
}

exports.update = (req, res) => {
    var id = req.params.id;
    var doc = {};
    doc.updated_date = new Date();
    var updateParams = ['scale', 'subdivisions', 'ss1m', 'ss1n1', 'ss1n2', 'ss1n3',
        'ss2m', 'ss2n1', 'ss2n2', 'ss2n3', 'background', 'color', 'name', 'size', 'angle'];
    updateParams.forEach(k => {
        doc[k] = req.body[k];
    });

    Model.findByIdAndUpdate({ _id: id }, doc).exec((err, doc) => {
        if (err !== null) {
            throw new Error(err);
        }
        res.sendStatus(204);
    });
}

exports.delete = (req,res) => {
    Model.findByIdAndDelete(req.params.id).exec(err => {
        if (err !== null) {
            throw new Error(err);
        }
        res.sendStatus(204);
    });
}