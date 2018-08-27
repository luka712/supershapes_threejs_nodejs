var mongoose = require('mongoose');


var Schema = mongoose.Schema;
var modelSchema = mongoose.Schema(
    {
        _id: Schema.Types.ObjectId,
        user_id: { type: Number, ref: 'ex_users' },
        name: String,
        created_date: Date,
        updated_date: Date,
        size: Number,
        background: [Number],
        color: [Number],
        subdivisions: Number,
        radius: Number,
        angle: Number,
        ss1m: Number,
        ss1n1: Number,
        ss1n2: Number,
        ss1n3: Number,
        ss2m: Number,
        ss2n1: Number,
        ss2n2: Number,
        ss2n3: Number
    }
);

module.exports = mongoose.model('model', modelSchema);

