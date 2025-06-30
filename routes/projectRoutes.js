// routes/projectRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { authenticateToken, authorizePermission } = require('../middleware/authMiddleware');

// @route GET /api/projects
// @desc Get all projects (or projects assigned to the current user if not admin)
// @access Private (Admin: VIEW_PROJECTS, User: VIEW_ASSIGNED_PROJECTS)
router.get('/', authenticateToken, async (req, res) => {
    try {
        let query = supabase.from('projects').select(`
            id,
            name,
            description,
            status,
            assigned_users:project_users(
                user:users(
                    id,
                    full_name,
                    email
                )
            )
        `);

        if (req.user.roleName !== 'Admin') {
            // If not an Admin, only show projects the user is assigned to
            query = query.filter('project_users.user_id', 'eq', req.user.userId);
        }

        const { data: projects, error } = await query;
        if (error) throw error;
        res.status(200).json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route GET /api/projects/:id
// @desc Get a single project by ID
// @access Private (Admin: VIEW_PROJECTS, User: VIEW_ASSIGNED_PROJECTS)
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        let query = supabase.from('projects').select(`
            id,
            name,
            description,
            status,
            assigned_users:project_users(
                user:users(
                    id,
                    full_name,
                    email
                )
            )
        `).eq('id', id);

        if (req.user.roleName !== 'Admin') {
            // If not an Admin, ensure the user is assigned to this project
            const { data: projectUser, error: projectUserError } = await supabase
                .from('project_users')
                .select('project_id')
                .eq('project_id', id)
                .eq('user_id', req.user.userId)
                .single();

            if (projectUserError || !projectUser) {
                return res.status(403).json({ message: 'Access denied to this project.' });
            }
        }

        const { data: project, error } = await query.single();
        if (error) throw error;
        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }
        res.status(200).json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route POST /api/projects
// @desc Create a new project
// @access Private (Admin, Can Create Projects)
router.post('/', authenticateToken, authorizePermission('CREATE_PROJECTS'), async (req, res) => {
    const { name, description, status, assignedUserIds = [] } = req.body;

    if (!name || !description) {
        return res.status(400).json({ message: 'Project name and description are required.' });
    }

    try {
        // Check if project name already exists
        const { data: existingProject, error: existingProjectError } = await supabase
            .from('projects')
            .select('id')
            .eq('name', name)
            .single();

        if (existingProject) {
            return res.status(400).json({ message: 'Project with this name already exists.' });
        }

        const { data: newProject, error: createProjectError } = await supabase
            .from('projects')
            .insert({ name, description, status: status !== undefined ? status : true })
            .select()
            .single();

        if (createProjectError) throw createProjectError;

        // Assign users to the project
        if (assignedUserIds.length > 0) {
            const projectUsers = assignedUserIds.map(user_id => ({
                project_id: newProject.id,
                user_id
            }));
            const { error: assignUsersError } = await supabase
                .from('project_users')
                .insert(projectUsers);

            if (assignUsersError) throw assignUsersError;
        }

        res.status(201).json({ message: 'Project created successfully.', project: newProject });
    } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route PUT /api/projects/:id
// @desc Update an existing project
// @access Private (Admin, Can Edit Projects)
router.put('/:id', authenticateToken, authorizePermission('EDIT_PROJECTS'), async (req, res) => {
    const { id } = req.params;
    const { name, description, status, assignedUserIds = [] } = req.body;

    try {
        let updateData = {};
        if (name) {
            const { data: existingProject, error: existingProjectError } = await supabase
                .from('projects')
                .select('id')
                .eq('name', name)
                .neq('id', id)
                .single();

            if (existingProject) {
                return res.status(400).json({ message: 'Another project with this name already exists.' });
            }
            updateData.name = name;
        }
        if (description) updateData.description = description;
        if (status !== undefined) updateData.status = status;

        if (Object.keys(updateData).length === 0 && assignedUserIds.length === 0) {
            return res.status(400).json({ message: 'No fields to update or users to assign provided.' });
        }

        const { data: updatedProject, error: updateProjectError } = await supabase
            .from('projects')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (updateProjectError) throw updateProjectError;
        if (!updatedProject) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        // Update assigned users: Delete existing and insert new ones
        await supabase.from('project_users').delete().eq('project_id', id);

        if (assignedUserIds.length > 0) {
            const projectUsers = assignedUserIds.map(user_id => ({
                project_id: id,
                user_id
            }));
            const { error: assignUsersError } = await supabase
                .from('project_users')
                .insert(projectUsers);

            if (assignUsersError) throw assignUsersError;
        }

        res.status(200).json({ message: 'Project updated successfully.', project: updatedProject });
    } catch (error) {
        console.error('Error updating project:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route DELETE /api/projects/:id
// @desc Delete a project
// @access Private (Admin, Can Delete Projects)
router.delete('/:id', authenticateToken, authorizePermission('DELETE_PROJECTS'), async (req, res) => {
    const { id } = req.params;
    try {
        // Delete associated project_users first
        const { error: deleteProjectUsersError } = await supabase
            .from('project_users')
            .delete()
            .eq('project_id', id);

        if (deleteProjectUsersError) throw deleteProjectUsersError;

        // Delete associated farmers (optional, depending on business logic - cascade delete or restrict)
        // For now, let's assume farmers linked to a project can also be deleted or re-assigned
        // If you want to prevent deletion if farmers are linked, add a check here.
        const { error: deleteFarmersError } = await supabase
            .from('farmers')
            .delete()
            .eq('project_id', id);
        if (deleteFarmersError) {
             console.warn(`Could not delete associated farmers for project ${id}. Error: ${deleteFarmersError.message}`);
             // Decide whether to throw error or continue
        }


        // Then delete the project
        const { error: deleteProjectError } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (deleteProjectError) throw deleteProjectError;

        res.status(200).json({ message: 'Project deleted successfully.' });
    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

module.exports = router;