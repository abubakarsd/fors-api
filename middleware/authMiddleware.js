// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabaseClient');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token.' });
        }
        req.user = user; // Attach user payload from token to request

        // Optionally, re-verify user's active status from DB
        const { data, error } = await supabase
            .from('users')
            .select('is_active, activation_status')
            .eq('id', req.user.userId)
            .single();

        if (error || !data || !data.is_active || data.activation_status === false) {
            return res.status(403).json({ message: 'User is inactive or not found.' });
        }
        next();
    });
};

const authorizeRole = (requiredRoleName) => {
    return async (req, res, next) => {
        const { data: userWithRole, error: userError } = await supabase
            .from('users')
            .select(`
                id,
                role:roles(
                    role_name
                )
            `)
            .eq('id', req.user.userId)
            .single();

        if (userError || !userWithRole || !userWithRole.role) {
            return res.status(403).json({ message: 'User role not found or access denied.' });
        }

        if (userWithRole.role.role_name !== requiredRoleName) {
            return res.status(403).json({ message: `Access denied. Requires ${requiredRoleName} role.` });
        }
        next();
    };
};

const authorizePermission = (permissionCode) => {
    return async (req, res, next) => {
        const { data: userPermissions, error: permissionError } = await supabase
            .from('users')
            .select(`
                id,
                role:roles(
                    role_permissions(
                        permission:permissions(
                            permission_code
                        )
                    )
                )
            `)
            .eq('id', req.user.userId)
            .single();

        if (permissionError || !userPermissions || !userPermissions.role || !userPermissions.role.role_permissions) {
            return res.status(403).json({ message: 'User permissions not found or access denied.' });
        }

        const hasPermission = userPermissions.role.role_permissions.some(rp =>
            rp.permission && rp.permission.permission_code === permissionCode
        );

        if (!hasPermission) {
            return res.status(403).json({ message: `Access denied. Requires permission: ${permissionCode}` });
        }
        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRole,
    authorizePermission
};