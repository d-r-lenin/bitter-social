import { model , Schema } from 'mongoose';

const friendRequestSchema = new Schema({
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    }
},
{
    timestamps:{
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

export default model('FriendRequest', friendRequestSchema);