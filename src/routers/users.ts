// express router
import express from 'express';
import controller from '../controllers/users';
import { auth } from '../controllers/middlewares';

const router = express.Router();

router.post('/signUp', controller.sighUp);
router.get('/signUp', controller.signUpPage);
router.post('/signIn', controller.signIn);
router.get('/signIn', controller.signInPage);
router.get('/signOut', controller.signOut);

router.get('/', auth, controller.getUsers);

// friends
router.post('/friends/add', auth, controller.sendFriendRequest);
router.post('/friends/accept', auth, controller.acceptFriendRequest);
router.post('/friends/reject', auth, controller.rejectFriendRequest);
router.post('/friends/remove', auth, controller.removeFriend);



export { router };
