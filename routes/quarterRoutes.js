// routes/quarterRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { authenticateToken, authorizePermission } = require('../middleware/authMiddleware');

// @route GET /api/quarters
// @desc Get all quarters
// @access Private (Admin, Can Manage Quarters)
router.get('/', authenticateToken, authorizePermission('VIEW_QUARTERS'), async (req, res) => {
    try {
        const { data: quarters, error } = await supabase
            .from('quarters')
            .select('*')
            .order('start_date', { ascending: false }); // Order by most recent quarter first
        if (error) throw error;
        res.status(200).json(quarters);
    } catch (error) {
        console.error('Error fetching quarters:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route GET /api/quarters/:id
// @desc Get a single quarter by ID
// @access Private (Admin, Can Manage Quarters)
router.get('/:id', authenticateToken, authorizePermission('VIEW_QUARTERS'), async (req, res) => {
    const { id } = req.params;
    try {
        const { data: quarter, error } = await supabase
            .from('quarters')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        if (!quarter) {
            return res.status(404).json({ message: 'Quarter not found.' });
        }
        res.status(200).json(quarter);
    } catch (error) {
        console.error('Error fetching quarter:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route POST /api/quarters
// @desc Create a new quarter
// @access Private (Admin, Can Manage Quarters)
router.post('/', authenticateToken, authorizePermission('ADD_QUARTERS'), async (req, res) => {
    const { name, startDate, endDate } = req.body;

    if (!name || !startDate || !endDate) {
        return res.status(400).json({ message: 'Quarter name, start date, and end date are required.' });
    }

    try {
        // Optional: Add validation to ensure start_date is before end_date
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ message: 'Start date must be before end date.' });
        }

        // Check for overlapping quarters (optional but recommended for robust data)
        const { data: overlappingQuarters, error: overlapError } = await supabase
            .from('quarters')
            .select('id')
            .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

        if (overlapError) throw overlapError;

        if (overlappingQuarters && overlappingQuarters.length > 0) {
            return res.status(400).json({ message: 'New quarter overlaps with an existing quarter.' });
        }

        const { data: newQuarter, error } = await supabase
            .from('quarters')
            .insert({ name, start_date: startDate, end_date: endDate })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Quarter created successfully.', quarter: newQuarter });
    } catch (error) {
        console.error('Error creating quarter:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route PUT /api/quarters/:id
// @desc Update an existing quarter
// @access Private (Admin, Can Manage Quarters)
router.put('/:id', authenticateToken, authorizePermission('EDIT_QUARTERS'), async (req, res) => {
    const { id } = req.params;
    const { name, startDate, endDate } = req.body;

    if (!name || !startDate || !endDate) {
        return res.status(400).json({ message: 'Quarter name, start date, and end date are required.' });
    }

    try {
        // Optional: Add validation to ensure start_date is before end_date
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ message: 'Start date must be before end date.' });
        }

        // Check for overlapping quarters, excluding the current quarter being updated
        const { data: overlappingQuarters, error: overlapError } = await supabase
            .from('quarters')
            .select('id')
            .neq('id', id)
            .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

        if (overlapError) throw overlapError;

        if (overlappingQuarters && overlappingQuarters.length > 0) {
            return res.status(400).json({ message: 'Updated quarter overlaps with an existing quarter.' });
        }

        const { data: updatedQuarter, error } = await supabase
            .from('quarters')
            .update({ name, start_date: startDate, end_date: endDate })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        if (!updatedQuarter) {
            return res.status(404).json({ message: 'Quarter not found.' });
        }
        res.status(200).json({ message: 'Quarter updated successfully.', quarter: updatedQuarter });
    } catch (error) {
        console.error('Error updating quarter:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route DELETE /api/quarters/:id
// @desc Delete a quarter
// @access Private (Admin, Can Manage Quarters)
router.delete('/:id', authenticateToken, authorizePermission('DELETE_QUARTERS'), async (req, res) => {
    const { id } = req.params;
    try {
        // Implement logic to prevent deletion if projects/data are linked to this quarter.
        // For now, simple delete.
        const { error } = await supabase
            .from('quarters')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.status(200).json({ message: 'Quarter deleted successfully.' });
    } catch (error) {
        console.error('Error deleting quarter:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

module.exports = router;