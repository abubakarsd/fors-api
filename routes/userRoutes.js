// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const supabase = require('../config/supabaseClient');
const { authenticateToken, authorizeRole, authorizePermission } = require('../middleware/authMiddleware');

// @route GET /api/users
// @desc Get all users
// @access Private (Admin, Can View Users)
router.get('/', authenticateToken, authorizePermission('VIEW_USERS'), async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select(`
                id,
                full_name,
                email,
                activation_status,
                is_active,
                created_at,
                role:roles(
                    id,
                    role_name
                )
            `);
        if (error) throw error;
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route GET /api/users/:id
// @desc Get a single user by ID
// @access Private (Admin, Can View Users - self-view also allowed)
router.get('/:id', authenticateToken, authorizePermission('VIEW_USERS'), async (req, res) => {
    const { id } = req.params;
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select(`
                id,
                full_name,
                email,
                activation_status,
                is_active,
                created_at,
                role:roles(
                    id,
                    role_name
                )
            `)
            .eq('id', id)
            .single();
        if (error) throw error;
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route POST /api/users
// @desc Create a new user
// @access Private (Admin, Can Add Users)
router.post('/', authenticateToken, authorizePermission('ADD_USERS'), async (req, res) => {
    const { fullName, email, password, roleId, activationStatus, isActive } = req.body;

    if (!fullName || !email || !password || !roleId) {
        return res.status(400).json({ message: 'Please provide full name, email, password, and role ID.' });
    }

    try {
        const { data: existingUser, error: existingUserError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                full_name: fullName,
                email,
                password_hash: passwordHash,
                role_id: roleId,
                activation_status: activationStatus !== undefined ? activationStatus : true,
                is_active: isActive !== undefined ? isActive : true
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'User created successfully.', user: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route PUT /api/users/:id
// @desc Update an existing user
// @access Private (Admin, Can Edit Users)
router.put('/:id', authenticateToken, authorizePermission('EDIT_USERS'), async (req, res) => {
    const { id } = req.params;
    const { fullName, email, password, roleId, activationStatus, isActive } = req.body;

    try {
        let updateData = {};
        if (fullName) updateData.full_name = fullName;
        if (email) {
            // Check if new email already exists for another user
            const { data: existingUser, error: existingUserError } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .neq('id', id)
                .single();

            if (existingUser) {
                return res.status(400).json({ message: 'Another user with this email already exists.' });
            }
            updateData.email = email;
        }
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.password_hash = await bcrypt.hash(password, salt);
        }
        if (roleId) updateData.role_id = roleId;
        if (activationStatus !== undefined) updateData.activation_status = activationStatus;
        if (isActive !== undefined) updateData.is_active = isActive;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No fields to update provided.' });
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ message: 'User updated successfully.', user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route DELETE /api/users/:id
// @desc Delete a user
// @access Private (Admin, Can Delete Users)
router.delete('/:id', authenticateToken, authorizePermission('DELETE_USERS'), async (req, res) => {
    const { id } = req.params;
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

module.exports = router;