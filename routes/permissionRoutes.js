// routes/permissionRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { authenticateToken, authorizePermission } = require('../middleware/authMiddleware');

// @route GET /api/permissions
// @desc Get all permissions
// @access Private (Admin, Can View Permissions)
router.get('/', authenticateToken, authorizePermission('VIEW_PERMISSIONS'), async (req, res) => {
    try {
        const { data: permissions, error } = await supabase
            .from('permissions')
            .select('*');
        if (error) throw error;
        res.status(200).json(permissions);
    } catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route GET /api/permissions/:id
// @desc Get a single permission by ID
// @access Private (Admin, Can View Permissions)
router.get('/:id', authenticateToken, authorizePermission('VIEW_PERMISSIONS'), async (req, res) => {
    const { id } = req.params;
    try {
        const { data: permission, error } = await supabase
            .from('permissions')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        if (!permission) {
            return res.status(404).json({ message: 'Permission not found.' });
        }
        res.status(200).json(permission);
    } catch (error) {
        console.error('Error fetching permission:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route POST /api/permissions
// @desc Create a new permission
// @access Private (Admin, Can Add Permissions)
router.post('/', authenticateToken, authorizePermission('ADD_PERMISSIONS'), async (req, res) => {
    const { permissionName, permissionCode } = req.body;

    if (!permissionName || !permissionCode) {
        return res.status(400).json({ message: 'Permission name and code are required.' });
    }

    try {
        // Check if permission code already exists
        const { data: existingPermission, error: existingPermissionError } = await supabase
            .from('permissions')
            .select('id')
            .eq('permission_code', permissionCode)
            .single();

        if (existingPermission) {
            return res.status(400).json({ message: 'Permission with this code already exists.' });
        }

        const { data: newPermission, error } = await supabase
            .from('permissions')
            .insert({ permission_name: permissionName, permission_code: permissionCode })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Permission created successfully.', permission: newPermission });
    } catch (error) {
        console.error('Error creating permission:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route PUT /api/permissions/:id
// @desc Update an existing permission
// @access Private (Admin, Can Edit Permissions)
router.put('/:id', authenticateToken, authorizePermission('EDIT_PERMISSIONS'), async (req, res) => {
    const { id } = req.params;
    const { permissionName, permissionCode } = req.body;

    if (!permissionName || !permissionCode) {
        return res.status(400).json({ message: 'Permission name and code are required.' });
    }

    try {
        // Check if new permission code already exists for another permission
        const { data: existingPermission, error: existingPermissionError } = await supabase
            .from('permissions')
            .select('id')
            .eq('permission_code', permissionCode)
            .neq('id', id)
            .single();

        if (existingPermission) {
            return res.status(400).json({ message: 'Another permission with this code already exists.' });
        }

        const { data: updatedPermission, error } = await supabase
            .from('permissions')
            .update({ permission_name: permissionName, permission_code: permissionCode })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!updatedPermission) {
            return res.status(404).json({ message: 'Permission not found.' });
        }
        res.status(200).json({ message: 'Permission updated successfully.', permission: updatedPermission });
    } catch (error) {
        console.error('Error updating permission:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route DELETE /api/permissions/:id
// @desc Delete a permission
// @access Private (Admin, Can Delete Permissions)
router.delete('/:id', authenticateToken, authorizePermission('DELETE_PERMISSIONS'), async (req, res) => {
    const { id } = req.params;
    try {
        // Check if any roles are currently assigned this permission
        const { data: rolePermissions, error: rpCheckError } = await supabase
            .from('role_permissions')
            .select('permission_id')
            .eq('permission_id', id);

        if (rolePermissions && rolePermissions.length > 0) {
            return res.status(400).json({ message: 'Cannot delete permission: It is currently assigned to one or more roles.' });
        }

        const { error } = await supabase
            .from('permissions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(200).json({ message: 'Permission deleted successfully.' });
    } catch (error) {
        console.error('Error deleting permission:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

module.exports = router;