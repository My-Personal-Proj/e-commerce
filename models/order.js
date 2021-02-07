const mongoose = require('mongoose');

const { Schema } = mongoose;

const orderSchema = new Schema({
    user:{
        _id : {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        email: {
            type: String,
            required: true
        }
    },
    items: [{
        product:{
            type: Object,
            required:true
        },
        quantity: {
            type: Number,
            required: true
        }
    }]
});

module.exports = mongoose.model('Order',orderSchema);