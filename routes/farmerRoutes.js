// routes/farmerRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { authenticateToken, authorizePermission } = require('../middleware/authMiddleware');

// @route GET /api/farmers
// @desc Get all farmers (Admin: all, User: those associated with their projects)
// @access Private (Admin: VIEW_FARMERS, User: VIEW_FARMER_RECORDS)
router.get('/', authenticateToken, async (req, res) => {
    try {
        let query = supabase.from('farmers').select(`
            id,
            full_name,
            mobile_number,
            date_of_birth,
            age,
            gender,
            country_name,
            state_name,
            district_name,
            village_tract_name,
            village_name,
            date_added,
            latitude,
            longitude,
            farmer_type:farmer_types(
                id,
                name
            ),
            project:projects(
                id,
                name
            ),
            added_by_user:users(
                id,
                full_name,
                email
            )
        `);

        if (req.user.roleName !== 'Admin') {
            // Get projects assigned to the current user
            const { data: userProjects, error: userProjectsError } = await supabase
                .from('project_users')
                .select('project_id')
                .eq('user_id', req.user.userId);

            if (userProjectsError) throw userProjectsError;

            const projectIds = userProjects.map(p => p.project_id);

            if (projectIds.length === 0) {
                return res.status(200).json([]); // User is not assigned to any projects, so no farmers to show
            }

            query = query.in('project_id', projectIds);
        }

        const { data: farmers, error } = await query;
        if (error) throw error;
        res.status(200).json(farmers);
    } catch (error) {
        console.error('Error fetching farmers:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route GET /api/farmers/:id
// @desc Get a single farmer by ID
// @access Private (Admin: VIEW_FARMERS, User: VIEW_FARMER_RECORDS for their projects)
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        let query = supabase.from('farmers').select(`
            id,
            full_name,
            mobile_number,
            date_of_birth,
            age,
            gender,
            country_name,
            state_name,
            district_name,
            village_tract_name,
            village_name,
            date_added,
            latitude,
            longitude,
            farmer_type:farmer_types(
                id,
                name
            ),
            project:projects(
                id,
                name
            ),
            added_by_user:users(
                id,
                full_name,
                email
            )
        `).eq('id', id);

        const { data: farmer, error } = await query.single();
        if (error) throw error;
        if (!farmer) {
            return res.status(404).json({ message: 'Farmer not found.' });
        }

        // Authorization check for non-admin users
        if (req.user.roleName !== 'Admin') {
            const { data: projectUser, error: projectUserError } = await supabase
                .from('project_users')
                .select('project_id')
                .eq('project_id', farmer.project.id)
                .eq('user_id', req.user.userId)
                .single();

            if (projectUserError || !projectUser) {
                return res.status(403).json({ message: 'Access denied to this farmer record.' });
            }
        }

        res.status(200).json(farmer);
    } catch (error) {
        console.error('Error fetching farmer:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route POST /api/farmers
// @desc Create a new farmer record
// @access Private (Admin: CREATE_FARMER_RECORDS, User: ADD_FARMER_RECORDS in their projects)
router.post('/', authenticateToken, async (req, res) => {
    const {
        fullName, mobileNumber, dateOfBirth, age, gender, farmerTypeId, countryName,
        stateName, districtName, villageTractName, villageName, projectId, latitude, longitude
    } = req.body;

    if (!fullName || !farmerTypeId || !projectId) {
        return res.status(400).json({ message: 'Full name, farmer type, and project are required.' });
    }

    try {
        // Authorization check for non-admin users
        if (req.user.roleName !== 'Admin') {
            const { data: projectUser, error: projectUserError } = await supabase
                .from('project_users')
                .select('project_id')
                .eq('project_id', projectId)
                .eq('user_id', req.user.userId)
                .single();

            if (projectUserError || !projectUser) {
                return res.status(403).json({ message: 'You can only add farmers to projects you are assigned to.' });
            }
            // Check for ADD_FARMER_RECORDS permission for non-admin
            await authorizePermission('ADD_FARMER_RECORDS')(req, res, () => {});
            // If the above line doesn't throw an error, permission is granted.
        } else {
            // Admin users need CREATE_FARMER_RECORDS permission
            await authorizePermission('CREATE_FARMER_RECORDS')(req, res, () => {});
        }


        const { data: newFarmer, error } = await supabase
            .from('farmers')
            .insert({
                full_name: fullName,
                mobile_number: mobileNumber,
                date_of_birth: dateOfBirth,
                age: age,
                gender: gender,
                farmer_type_id: farmerTypeId,
                country_name: countryName,
                state_name: stateName,
                district_name: districtName,
                village_tract_name: villageTractName,
                village_name: villageName,
                project_id: projectId,
                added_by_user_id: req.user.userId,
                latitude: latitude,
                longitude: longitude
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Farmer record created successfully.', farmer: newFarmer });
    } catch (error) {
        console.error('Error creating farmer:', error);
        // Handle cases where authorizePermission throws an error
        if (error.message.includes('Access denied')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route PUT /api/farmers/:id
// @desc Update an existing farmer record
// @access Private (Admin: EDIT_FARMER_RECORDS, User: EDIT_FARMER_RECORDS in their projects)
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {
        fullName, mobileNumber, dateOfBirth, age, gender, farmerTypeId, countryName,
        stateName, districtName, villageTractName, villageName, projectId, latitude, longitude
    } = req.body;

    try {
        // First, check if the farmer exists and get their current project ID
        const { data: existingFarmer, error: farmerCheckError } = await supabase
            .from('farmers')
            .select('project_id')
            .eq('id', id)
            .single();

        if (farmerCheckError || !existingFarmer) {
            return res.status(404).json({ message: 'Farmer not found.' });
        }

        const currentProjectId = existingFarmer.project_id;
        const targetProjectId = projectId || currentProjectId; // If projectId is provided, use it, else use current

        // Authorization check for non-admin users
        if (req.user.roleName !== 'Admin') {
            const { data: projectUser, error: projectUserError } = await supabase
                .from('project_users')
                .select('project_id')
                .eq('project_id', targetProjectId)
                .eq('user_id', req.user.userId)
                .single();

            if (projectUserError || !projectUser) {
                return res.status(403).json({ message: 'You can only edit farmers in projects you are assigned to.' });
            }
            // Check for EDIT_FARMER_RECORDS permission for non-admin
            await authorizePermission('EDIT_FARMER_RECORDS')(req, res, () => {});
            // If the above line doesn't throw an error, permission is granted.
        } else {
            // Admin users need EDIT_FARMER_RECORDS permission
            await authorizePermission('EDIT_FARMER_RECORDS')(req, res, () => {});
        }

        const updateData = {
            full_name: fullName,
            mobile_number: mobileNumber,
            date_of_birth: dateOfBirth,
            age: age,
            gender: gender,
            farmer_type_id: farmerTypeId,
            country_name: countryName,
            state_name: stateName,
            district_name: districtName,
            village_tract_name: villageTractName,
            village_name: villageName,
            project_id: targetProjectId,
            latitude: latitude,
            longitude: longitude
        };

        // Filter out undefined values to only update provided fields
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No fields to update provided.' });
        }

        const { data: updatedFarmer, error } = await supabase
            .from('farmers')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!updatedFarmer) {
            return res.status(404).json({ message: 'Farmer not found.' });
        }
        res.status(200).json({ message: 'Farmer record updated successfully.', farmer: updatedFarmer });
    } catch (error) {
        console.error('Error updating farmer:', error);
        if (error.message.includes('Access denied')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route DELETE /api/farmers/:id
// @desc Delete a farmer record
// @access Private (Admin: DELETE_FARMER_RECORDS, User: DELETE_FARMER_RECORDS in their projects)
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // First, check if the farmer exists and get their current project ID
        const { data: existingFarmer, error: farmerCheckError } = await supabase
            .from('farmers')
            .select('project_id')
            .eq('id', id)
            .single();

        if (farmerCheckError || !existingFarmer) {
            return res.status(404).json({ message: 'Farmer not found.' });
        }

        // Authorization check for non-admin users
        if (req.user.roleName !== 'Admin') {
            const { data: projectUser, error: projectUserError } = await supabase
                .from('project_users')
                .select('project_id')
                .eq('project_id', existingFarmer.project_id)
                .eq('user_id', req.user.userId)
                .single();

            if (projectUserError || !projectUser) {
                return res.status(403).json({ message: 'You can only delete farmers from projects you are assigned to.' });
            }
            // Check for DELETE_FARMER_RECORDS permission for non-admin
            await authorizePermission('DELETE_FARMER_RECORDS')(req, res, () => {});
        } else {
            // Admin users need DELETE_FARMER_RECORDS permission
            await authorizePermission('DELETE_FARMER_RECORDS')(req, res, () => {});
        }

        const { error } = await supabase
            .from('farmers')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(200).json({ message: 'Farmer record deleted successfully.' });
    } catch (error) {
        console.error('Error deleting farmer:', error);
        if (error.message.includes('Access denied')) {
            return res.status(403).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

module.exports = router;