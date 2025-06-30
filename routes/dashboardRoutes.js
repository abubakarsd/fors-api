// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { authenticateToken, authorizePermission } = require('../middleware/authMiddleware');

// @route GET /api/dashboard/summary
// @desc Get dashboard summary statistics
// @access Private (Admin: VIEW_DASHBOARD, User: VIEW_DASHBOARD)
router.get('/summary', authenticateToken, authorizePermission('VIEW_DASHBOARD'), async (req, res) => {
    try {
        let totalFarmers = 0;
        let activeProjects = 0;
        let totalUsers = 0;
        let activeUsers = 0;
        let farmersInUserProjects = 0;

        if (req.user.roleName === 'Admin') {
            // Admin: Get global statistics
            const { count: farmersCount, error: farmersCountError } = await supabase
                .from('farmers')
                .select('*', { count: 'exact', head: true });
            if (farmersCountError) throw farmersCountError;
            totalFarmers = farmersCount;

            const { count: projectsCount, error: projectsCountError } = await supabase
                .from('projects')
                .select('*', { count: 'exact', head: true })
                .eq('status', true); // Assuming 'status' true means active
            if (projectsCountError) throw projectsCountError;
            activeProjects = projectsCount;

            const { count: usersCount, error: usersCountError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });
            if (usersCountError) throw usersCountError;
            totalUsers = usersCount;

            const { count: activeUsersCount, error: activeUsersCountError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true)
                .eq('activation_status', true);
            if (activeUsersCountError) throw activeUsersCountError;
            activeUsers = activeUsersCount;

        } else {
            // Regular User: Get statistics relevant to their assigned projects
            const userId = req.user.userId;

            // Get projects assigned to the current user
            const { data: userProjects, error: userProjectsError } = await supabase
                .from('project_users')
                .select('project_id')
                .eq('user_id', userId);

            if (userProjectsError) throw userProjectsError;

            const projectIds = userProjects.map(p => p.project_id);

            if (projectIds.length > 0) {
                // Count farmers in these projects
                const { count: userFarmersCount, error: userFarmersError } = await supabase
                    .from('farmers')
                    .select('*', { count: 'exact', head: true })
                    .in('project_id', projectIds);
                if (userFarmersError) throw userFarmersError;
                farmersInUserProjects = userFarmersCount;

                // Count active projects among those assigned
                const { count: userActiveProjects, error: userActiveProjectsError } = await supabase
                    .from('projects')
                    .select('*', { count: 'exact', head: true })
                    .in('id', projectIds)
                    .eq('status', true);
                if (userActiveProjectsError) throw userActiveProjectsError;
                activeProjects = userActiveProjects;
            }

            // User-specific stats
            totalFarmers = farmersInUserProjects; // For a user, 'total' farmers refers to those they can access
            totalUsers = 1; // Only the current user
            activeUsers = 1; // Assuming the current user is active to be on the dashboard
        }

        res.status(200).json({
            totalFarmers,
            activeProjects,
            totalUsers,
            activeUsers
            // Add other relevant summary stats as needed, e.g., trainings completed
        });

    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

module.exports = router;