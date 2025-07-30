import express from 'express';
import { prisma } from '../prisma';
import { USER_CONSTANTS } from '../config/user.constants';

const router = express.Router();

router.post('/', async (req, res) => {
    const { username } = req.body;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    try {
        const user = await prisma.user.create({
            data: {
                username,
                balance: USER_CONSTANTS.DEFAULT_USER_BALANCE
            }
        })
        return res.status(201).json(user);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to create user' });
    }
})

export default router;