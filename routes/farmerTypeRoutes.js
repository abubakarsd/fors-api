// routes/farmerTypeRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { authenticateToken, authorizePermission } = require('../middleware/authMiddleware');

// @route GET /api/farmer-types
// @desc Get all farmer types
// @access Private (Admin, Can View Farmer Types)
router.get('/', authenticateToken, authorizePermission('VIEW_FARMER_TYPES'), async (req, res) => {
    try {
        const { data: farmerTypes, error } = await supabase
            .from('farmer_types')
            .select('*');
        if (error) throw error;
        res.status(200).json(farmerTypes);
    } catch (error) {
        console.error('Error fetching farmer types:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route GET /api/farmer-types/:id
// @desc Get a single farmer type by ID
// @access Private (Admin, Can View Farmer Types)
router.get('/:id', authenticateToken, authorizePermission('VIEW_FARMER_TYPES'), async (req, res) => {
    const { id } = req.params;
    try {
        const { data: farmerType, error } = await supabase
            .from('farmer_types')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        if (!farmerType) {
            return res.status(404).json({ message: 'Farmer type not found.' });
        }
        res.status(200).json(farmerType);
    } catch (error) {
        console.error('Error fetching farmer type:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route POST /api/farmer-types
// @desc Create a new farmer type
// @access Private (Admin, Can Add Farmer Types)
router.post('/', authenticateToken, authorizePermission('ADD_FARMER_TYPES'), async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Farmer type name is required.' });
    }

    try {
        // Check if farmer type name already exists
        const { data: existingFarmerType, error: existingError } = await supabase
            .from('farmer_types')
            .select('id')
            .eq('name', name)
            .single();

        if (existingFarmerType) {
            return res.status(400).json({ message: 'Farmer type with this name already exists.' });
        }

        const { data: newFarmerType, error } = await supabase
            .from('farmer_types')
            .insert({ name })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Farmer type created successfully.', farmerType: newFarmerType });
    } catch (error) {
        console.error('Error creating farmer type:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route PUT /api/farmer-types/:id
// @desc Update an existing farmer type
// @access Private (Admin, Can Edit Farmer Types)
router.put('/:id', authenticateToken, authorizePermission('EDIT_FARMER_TYPES'), async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Farmer type name is required.' });
    }

    try {
        // Check if new farmer type name already exists for another type
        const { data: existingFarmerType, error: existingError } = await supabase
            .from('farmer_types')
            .select('id')
            .eq('name', name)
            .neq('id', id)
            .single();

        if (existingFarmerType) {
            return res.status(400).json({ message: 'Another farmer type with this name already exists.' });
        }

        const { data: updatedFarmerType, error } = await supabase
            .from('farmer_types')
            .update({ name })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!updatedFarmerType) {
            return res.status(404).json({ message: 'Farmer type not found.' });
        }
        res.status(200).json({ message: 'Farmer type updated successfully.', farmerType: updatedFarmerType });
    } catch (error) {
        console.error('Error updating farmer type:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route DELETE /api/farmer-types/:id
// @desc Delete a farmer type
// @access Private (Admin, Can Delete Farmer Types)
router.delete('/:id', authenticateToken, authorizePermission('DELETE_FARMER_TYPES'), async (req, res) => {
    const { id } = req.params;
    try {
        // Check if any farmers are linked to this farmer type
        const { data: linkedFarmers, error: linkedFarmersError } = await supabase
            .from('farmers')
            .select('id')
            .eq('farmer_type_id', id);

        if (linkedFarmersError) throw linkedFarmersError;
        if (linkedFarmers && linkedFarmers.length > 0) {
            return res.status(400).json({ message: 'Cannot delete farmer type: It is currently linked to existing farmer records.' });
        }

        const { error } = await supabase
            .from('farmer_types')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(200).json({ message: 'Farmer type deleted successfully.' });
    } catch (error) {
        console.error('Error deleting farmer type:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

module.exports = router;