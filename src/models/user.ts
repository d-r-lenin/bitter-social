import { model, Schema } from 'mongoose';


const userSchema = new Schema({
    firstName : {
        required: true,
        type: "string"
    },
    middleName : {
        type: "string"
    },
    lastName : {
        type: "string"
    },
    email : {
        unique: true,
        required: true,
        type: "string"
    },
    password : {
        required: true,
        type: "string"
    },
    username : {
        index: true,
        unique: true,
        required: true,
        type: "string"
    }
},
{
    timestamps:{
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const User = model('user',userSchema);  

export default User;