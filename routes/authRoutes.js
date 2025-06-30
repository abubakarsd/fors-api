// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const supabase = require('../config/supabaseClient');

// Nodemailer transporter setup (replace with your actual email service)
const transporter = nodemailer.createTransport({
    service: 'gmail', // e.g., 'gmail', 'SendGrid'
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Helper to generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

// @route POST /api/auth/register
// @desc Register a new user (Admin only)
// @access Private (Admin) - In a real app, this might be handled by an Admin via user management
router.post('/register', async (req, res) => {
    // This route would typically be secured by an admin role or an initial setup process.
    // For this example, it's open, but remember to add authorizeRole('Admin') for production.
    const { fullName, email, password, roleName } = req.body;

    if (!fullName || !email || !password || !roleName) {
        return res.status(400).json({ message: 'Please enter all fields.' });
    }

    try {
        // Check if user already exists
        const { data: existingUser, error: existingUserError } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // Get role ID
        const { data: role, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('role_name', roleName)
            .single();

        if (roleError || !role) {
            return res.status(400).json({ message: 'Invalid role name provided.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert new user
        const { data: newUser, error: createUserError } = await supabase
            .from('users')
            .insert({
                full_name: fullName,
                email,
                password_hash: passwordHash,
                role_id: role.id,
                activation_status: true, // Default to active upon registration by admin
                is_active: true
            })
            .select()
            .single();

        if (createUserError) {
            throw createUserError;
        }

        res.status(201).json({ message: 'User registered successfully. An admin needs to manage activation if needed.', user: newUser });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});

// @route POST /api/auth/login
// @desc Authenticate user & get token (with OTP)
// @access Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please enter all fields.' });
    }

    try {
        // Check for user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, full_name, email, password_hash, otp, activation_status, is_active, role_id, role:roles(role_name)')
            .eq('email', email)
            .single();

        if (userError || !user) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials.' });
        }

        // Check activation and active status
        if (!user.activation_status || !user.is_active) {
            return res.status(403).json({ message: 'Your account is inactive. Please contact an administrator.' });
        }

        // Generate and send OTP
        const otp = generateOTP();
        const { error: updateOtpError } = await supabase
            .from('users')
            .update({ otp: otp })
            .eq('id', user.id);

        if (updateOtpError) {
            throw updateOtpError;
        }

        // Send OTP via email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'FORS Login OTP',
            text: `Your One-Time Password (OTP) for FORS login is: ${otp}. This OTP is valid for a short period.`,
            html: `<p>Your One-Time Password (OTP) for FORS login is: <strong>${otp}</strong>.</p><p>This OTP is valid for a short period.</p>`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending OTP email:', error);
                // Even if email fails, we don't block login, but log the error
            } else {
                console.log('OTP Email sent:', info.response);
            }
        });

        res.status(200).json({ message: 'OTP sent to your email. Please verify to complete login.' });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
});

// @route POST /api/auth/verify-otp
// @desc Verify OTP and issue JWT
// @access Public
router.post('/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    try {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, email, otp, full_name, role_id, role:roles(role_name)')
            .eq('email', email)
            .single();

        if (userError || !user) {
            return res.status(400).json({ message: 'Invalid email or OTP.' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        // Clear OTP after successful verification
        const { error: clearOtpError } = await supabase
            .from('users')
            .update({ otp: null })
            .eq('id', user.id);

        if (clearOtpError) {
            console.error('Error clearing OTP:', clearOtpError);
            // Don't block login if OTP clearing fails, but log it
        }

        // Generate JWT
        const payload = {
            userId: user.id,
            email: user.email,
            roleName: user.role.role_name
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour

        res.status(200).json({
            message: 'OTP verified successfully.',
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                roleName: user.role.role_name
            }
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Server error during OTP verification.', error: error.message });
    }
});


module.exports = router;