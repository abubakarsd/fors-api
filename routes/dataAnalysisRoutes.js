// routes/dataAnalysisRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { authenticateToken, authorizePermission } = require('../middleware/authMiddleware');

// @route GET /api/data-analysis/farmers-by-gender
// @desc Get farmer count by gender
// @access Private (Admin: ANALYZE_DATA, User: ANALYZE_PROJECT_DATA)
router.get('/farmers-by-gender', authenticateToken, authorizePermission('ANALYZE_DATA'), async (req, res) => {
    try {
        let query = supabase.from('farmers').select('gender', { count: 'exact' });

        if (req.user.roleName !== 'Admin') {
            // For non-admin, filter by projects they are assigned to
            const { data: userProjects, error: userProjectsError } = await supabase
                .from('project_users')
                .select('project_id')
                .eq('user_id', req.user.userId);

            if (userProjectsError) throw userProjectsError;
            const projectIds = userProjects.map(p => p.project_id);

            if (projectIds.length === 0) {
                return res.status(200).json([]); // No projects, no data
            }
            query = query.in('project_id', projectIds);
        }

        const { data: farmers, error } = await query;
        if (error) throw error;

        // Aggregate by gender
        const genderCounts = farmers.reduce((acc, farmer) => {
            const gender = farmer.gender || 'Unknown';
            acc[gender] = (acc[gender] || 0) + 1;
            return acc;
        }, {});

        // Format for response
        const result = Object.keys(genderCounts).map(gender => ({
            gender,
            count: genderCounts[gender]
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching farmers by gender:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route GET /api/data-analysis/farmers-by-type
// @desc Get farmer count by farmer type
// @access Private (Admin: ANALYZE_DATA, User: ANALYZE_PROJECT_DATA)
router.get('/farmers-by-type', authenticateToken, authorizePermission('ANALYZE_DATA'), async (req, res) => {
    try {
        let query = supabase.from('farmers').select(`
            farmer_type:farmer_types(
                name
            )
        `, { count: 'exact' });

        if (req.user.roleName !== 'Admin') {
            const { data: userProjects, error: userProjectsError } = await supabase
                .from('project_users')
                .select('project_id')
                .eq('user_id', req.user.userId);

            if (userProjectsError) throw userProjectsError;
            const projectIds = userProjects.map(p => p.project_id);

            if (projectIds.length === 0) {
                return res.status(200).json([]);
            }
            query = query.in('project_id', projectIds);
        }

        const { data: farmers, error } = await query;
        if (error) throw error;

        const farmerTypeCounts = farmers.reduce((acc, farmer) => {
            const typeName = farmer.farmer_type?.name || 'Unknown';
            acc[typeName] = (acc[typeName] || 0) + 1;
            return acc;
        }, {});

        const result = Object.keys(farmerTypeCounts).map(type => ({
            farmerType: type,
            count: farmerTypeCounts[type]
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching farmers by type:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route GET /api/data-analysis/farmers-by-project
// @desc Get farmer count by project
// @access Private (Admin: ANALYZE_DATA, User: ANALYZE_PROJECT_DATA)
router.get('/farmers-by-project', authenticateToken, authorizePermission('ANALYZE_DATA'), async (req, res) => {
    try {
        let query = supabase.from('farmers').select(`
            project:projects(
                name
            )
        `, { count: 'exact' });

        if (req.user.roleName !== 'Admin') {
            const { data: userProjects, error: userProjectsError } = await supabase
                .from('project_users')
                .select('project_id')
                .eq('user_id', req.user.userId);

            if (userProjectsError) throw userProjectsError;
            const projectIds = userProjects.map(p => p.project_id);

            if (projectIds.length === 0) {
                return res.status(200).json([]);
            }
            query = query.in('project_id', projectIds);
        }

        const { data: farmers, error } = await query;
        if (error) throw error;

        const projectCounts = farmers.reduce((acc, farmer) => {
            const projectName = farmer.project?.name || 'Unassigned';
            acc[projectName] = (acc[projectName] || 0) + 1;
            return acc;
        }, {});

        const result = Object.keys(projectCounts).map(project => ({
            projectName: project,
            count: projectCounts[project]
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching farmers by project:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route GET /api/data-analysis/farmers-by-region
// @desc Get farmer count by state/district
// @access Private (Admin: ANALYZE_DATA, User: ANALYZE_PROJECT_DATA)
router.get('/farmers-by-region', authenticateToken, authorizePermission('ANALYZE_DATA'), async (req, res) => {
    const { groupBy = 'state' } = req.query; // 'state' or 'district'

    if (!['state', 'district'].includes(groupBy)) {
        return res.status(400).json({ message: 'Invalid groupBy parameter. Must be "state" or "district".' });
    }

    try {
        let query = supabase.from('farmers').select(`
            state_name,
            district_name
        `, { count: 'exact' });

        if (req.user.roleName !== 'Admin') {
            const { data: userProjects, error: userProjectsError } = await supabase
                .from('project_users')
                .select('project_id')
                .eq('user_id', req.user.userId);

            if (userProjectsError) throw userProjectsError;
            const projectIds = userProjects.map(p => p.project_id);

            if (projectIds.length === 0) {
                return res.status(200).json([]);
            }
            query = query.in('project_id', projectIds);
        }

        const { data: farmers, error } = await query;
        if (error) throw error;

        const regionCounts = farmers.reduce((acc, farmer) => {
            const key = groupBy === 'state' ? farmer.state_name || 'Unknown State' : farmer.district_name || 'Unknown District';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const result = Object.keys(regionCounts).map(region => ({
            [groupBy === 'state' ? 'stateName' : 'districtName']: region,
            count: regionCounts[region]
        }));

        res.status(200).json(result);
    } catch (error) {
        console.error('Error fetching farmers by region:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// Add more data analysis routes as needed, e.g.:
// - Farmers by age group
// - Training effectiveness (if training module is implemented)
// - Project coverage
// - Adoption rates (requires more data points on farmer activities)

module.exports = router;