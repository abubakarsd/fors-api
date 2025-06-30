// routes/roleRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { authenticateToken, authorizePermission } = require('../middleware/authMiddleware');

// @route GET /api/roles
// @desc Get all roles with their permissions
// @access Private (Admin, Can View Roles)
router.get('/', authenticateToken, authorizePermission('VIEW_ROLES'), async (req, res) => {
    try {
        const { data: roles, error } = await supabase
            .from('roles')
            .select(`
                id,
                role_name,
                role_permissions(
                    permission:permissions(
                        id,
                        permission_name,
                        permission_code
                    )
                )
            `);
        if (error) throw error;
        res.status(200).json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route GET /api/roles/:id
// @desc Get a single role by ID with its permissions
// @access Private (Admin, Can View Roles)
router.get('/:id', authenticateToken, authorizePermission('VIEW_ROLES'), async (req, res) => {
    const { id } = req.params;
    try {
        const { data: role, error } = await supabase
            .from('roles')
            .select(`
                id,
                role_name,
                role_permissions(
                    permission:permissions(
                        id,
                        permission_name,
                        permission_code
                    )
                )
            `)
            .eq('id', id)
            .single();
        if (error) throw error;
        if (!role) {
            return res.status(404).json({ message: 'Role not found.' });
        }
        res.status(200).json(role);
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route POST /api/roles
// @desc Create a new role
// @access Private (Admin, Can Add Roles)
router.post('/', authenticateToken, authorizePermission('ADD_ROLES'), async (req, res) => {
    const { roleName, permissionIds = [] } = req.body;

    if (!roleName) {
        return res.status(400).json({ message: 'Role name is required.' });
    }

    try {
        // Check if role name already exists
        const { data: existingRole, error: existingRoleError } = await supabase
            .from('roles')
            .select('id')
            .eq('role_name', roleName)
            .single();

        if (existingRole) {
            return res.status(400).json({ message: 'Role with this name already exists.' });
        }

        // Create the role
        const { data: newRole, error: createRoleError } = await supabase
            .from('roles')
            .insert({ role_name: roleName })
            .select()
            .single();

        if (createRoleError) throw createRoleError;

        // Assign permissions if provided
        if (permissionIds.length > 0) {
            const rolePermissions = permissionIds.map(permission_id => ({
                role_id: newRole.id,
                permission_id
            }));
            const { error: assignPermissionError } = await supabase
                .from('role_permissions')
                .insert(rolePermissions);

            if (assignPermissionError) throw assignPermissionError;
        }

        res.status(201).json({ message: 'Role created successfully.', role: newRole });
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route PUT /api/roles/:id
// @desc Update an existing role and its permissions
// @access Private (Admin, Can Edit Roles)
router.put('/:id', authenticateToken, authorizePermission('EDIT_ROLES'), async (req, res) => {
    const { id } = req.params;
    const { roleName, permissionIds = [] } = req.body; // permissionIds is the new set of permissions

    if (!roleName) {
        return res.status(400).json({ message: 'Role name is required.' });
    }

    try {
        // Check if role name already exists for another role
        const { data: existingRole, error: existingRoleError } = await supabase
            .from('roles')
            .select('id')
            .eq('role_name', roleName)
            .neq('id', id)
            .single();

        if (existingRole) {
            return res.status(400).json({ message: 'Another role with this name already exists.' });
        }

        // Update the role name
        const { data: updatedRole, error: updateRoleError } = await supabase
            .from('roles')
            .update({ role_name: roleName })
            .eq('id', id)
            .select()
            .single();

        if (updateRoleError) throw updateRoleError;
        if (!updatedRole) {
            return res.status(404).json({ message: 'Role not found.' });
        }

        // Update permissions: Delete existing and insert new ones
        await supabase.from('role_permissions').delete().eq('role_id', id);

        if (permissionIds.length > 0) {
            const rolePermissions = permissionIds.map(permission_id => ({
                role_id: id,
                permission_id
            }));
            const { error: assignPermissionError } = await supabase
                .from('role_permissions')
                .insert(rolePermissions);

            if (assignPermissionError) throw assignPermissionError;
        }

        res.status(200).json({ message: 'Role updated successfully.', role: updatedRole });
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route DELETE /api/roles/:id
// @desc Delete a role
// @access Private (Admin, Can Delete Roles)
router.delete('/:id', authenticateToken, authorizePermission('DELETE_ROLES'), async (req, res) => {
    const { id } = req.params;
    try {
        // First, check if any users are assigned to this role
        const { data: usersWithRole, error: usersCheckError } = await supabase
            .from('users')
            .select('id')
            .eq('role_id', id);

        if (usersWithRole && usersWithRole.length > 0) {
            return res.status(400).json({ message: 'Cannot delete role: Users are currently assigned to this role.' });
        }

        // Delete associated role_permissions first
        const { error: deleteRolePermissionsError } = await supabase
            .from('role_permissions')
            .delete()
            .eq('role_id', id);

        if (deleteRolePermissionsError) throw deleteRolePermissionsError;

        // Then delete the role
        const { error: deleteRoleError } = await supabase
            .from('roles')
            .delete()
            .eq('id', id);

        if (deleteRoleError) throw deleteRoleError;

        res.status(200).json({ message: 'Role deleted successfully.' });
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

module.exports = router;