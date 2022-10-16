import { model, Schema } from 'mongoose';


const friendsListSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    friends: [{
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }]
},
{
    timestamps:{
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});


export default model('FriendsList', friendsListSchema);
