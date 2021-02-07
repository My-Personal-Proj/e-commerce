const mongoose = require('mongoose');

const Schema = mongoose.Schema;
//const method = Schema.methods;

const userSchema = new Schema({
    
    password: {
        type: String,
        required: true
    }
    ,
    email: {
        type: String,
        required:true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart:{
        items:[{productId: {type: Schema.Types.ObjectId, ref:'Product', required: true},
        quantity: {type: Number , required:true}}]
    }
});

const method = userSchema.methods;

method.addToCart = function( product ){
        const cartProductIndex = this.cart.items.findIndex(cp => {
            return cp.productId.toString() === product._id.toString()
        });

        let newQuantity = 1;
        const updatedCartItems = [...this.cart.items]

        if(cartProductIndex >= 0){
            newQuantity = this.cart.items[cartProductIndex].quantity + 1;
            updatedCartItems[cartProductIndex].quantity = newQuantity;
        }
        else{
            updatedCartItems.push(
                {
                    productId: product._id, 
                    quantity:newQuantity
                }
            );
        }

        const updatedCart = { 
            items : updatedCartItems
        };

       this.cart = updatedCart;
       return this.save();
    
}

method.deleteItemFromCart = function(prodId){
    const updatedCartItems = this.cart.items.filter(item => item.productId.toString() !== prodId.toString());
    this.cart = {items:updatedCartItems};
    return this.save();
}

method.clearCart = function(){
    this.cart.items=[];
    return this.save();
}



module.exports = mongoose.model('User', userSchema);
