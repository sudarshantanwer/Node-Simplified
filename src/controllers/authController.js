const UserModel = require('../models/userModel');
const JWTUtils = require('../utils/jwtUtils');

// In-memory token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set();

class AuthController {
    /**
     * Register a new user
     */
    static async register(req, res) {
        try {
            const { username, email, password, role } = req.body;

            // Create new user
            const newUser = await UserModel.createUser({
                username,
                email,
                password,
                role
            });

            // Generate tokens
            const tokens = JWTUtils.generateTokenPair(newUser);

            // Store refresh token in user model
            await UserModel.addRefreshToken(newUser.id, tokens.refreshToken);

            // Set secure HTTP-only cookie for refresh token (optional)
            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: newUser,
                    tokens: {
                        accessToken: tokens.accessToken,
                        tokenType: tokens.tokenType,
                        expiresIn: tokens.expiresIn
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Registration error:', error);
            
            if (error.message.includes('already exists')) {
                return res.status(409).json({
                    success: false,
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error during registration',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Login user
     */
    static async login(req, res) {
        try {
            const { emailOrUsername, password, rememberMe } = req.body;

            // Find user by email or username
            const user = await UserModel.findByCredentials(emailOrUsername);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                    timestamp: new Date().toISOString()
                });
            }

            // Verify password
            const isPasswordValid = await UserModel.comparePassword(password, user.password);
            
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid credentials',
                    timestamp: new Date().toISOString()
                });
            }

            // Update last login
            await UserModel.updateLastLogin(user.id);

            // Get user without password
            const { password: _, refreshTokens: __, ...userWithoutPassword } = user;

            // Generate tokens
            const tokens = JWTUtils.generateTokenPair(userWithoutPassword);

            // Store refresh token
            await UserModel.addRefreshToken(user.id, tokens.refreshToken);

            // Set refresh token cookie
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000 // 30 days if remember me, else 7 days
            };

            res.cookie('refreshToken', tokens.refreshToken, cookieOptions);

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    user: userWithoutPassword,
                    tokens: {
                        accessToken: tokens.accessToken,
                        tokenType: tokens.tokenType,
                        expiresIn: tokens.expiresIn
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during login',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Refresh access token
     */
    static async refreshToken(req, res) {
        try {
            // Get refresh token from body or cookie
            const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token not provided',
                    timestamp: new Date().toISOString()
                });
            }

            // Check if token is blacklisted
            if (tokenBlacklist.has(refreshToken)) {
                return res.status(401).json({
                    success: false,
                    message: 'Refresh token has been revoked',
                    timestamp: new Date().toISOString()
                });
            }

            // Verify refresh token
            const decoded = JWTUtils.verifyRefreshToken(refreshToken);

            // Check if refresh token exists in user's token list
            const isValidRefreshToken = await UserModel.verifyRefreshToken(decoded.userId, refreshToken);
            
            if (!isValidRefreshToken) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token',
                    timestamp: new Date().toISOString()
                });
            }

            // Get user
            const user = await UserModel.findById(decoded.userId);
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found',
                    timestamp: new Date().toISOString()
                });
            }

            // Generate new tokens
            const tokens = JWTUtils.generateTokenPair(user);

            // Remove old refresh token and add new one
            await UserModel.removeRefreshToken(user.id, refreshToken);
            await UserModel.addRefreshToken(user.id, tokens.refreshToken);

            // Blacklist old refresh token
            tokenBlacklist.add(refreshToken);

            // Update refresh token cookie
            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    tokens: {
                        accessToken: tokens.accessToken,
                        tokenType: tokens.tokenType,
                        expiresIn: tokens.expiresIn
                    }
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Refresh token error:', error);
            
            if (error.message.includes('expired') || error.message.includes('Invalid')) {
                return res.status(401).json({
                    success: false,
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error during token refresh',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Logout user
     */
    static async logout(req, res) {
        try {
            const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
            const accessToken = req.accessToken; // From auth middleware

            if (refreshToken) {
                // Remove refresh token from user's token list
                if (req.user && req.user.userId) {
                    await UserModel.removeRefreshToken(req.user.userId, refreshToken);
                }

                // Add to blacklist
                tokenBlacklist.add(refreshToken);
            }

            if (accessToken) {
                // Add access token to blacklist
                tokenBlacklist.add(accessToken);
            }

            // Clear refresh token cookie
            res.clearCookie('refreshToken');

            res.json({
                success: true,
                message: 'Logout successful',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during logout',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Logout from all devices
     */
    static async logoutAll(req, res) {
        try {
            const userId = req.user.userId;

            // Remove all refresh tokens for this user
            await UserModel.removeAllRefreshTokens(userId);

            // Clear refresh token cookie
            res.clearCookie('refreshToken');

            res.json({
                success: true,
                message: 'Logged out from all devices successfully',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Logout all error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during logout all',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Get current user profile
     */
    static async getProfile(req, res) {
        try {
            const user = await UserModel.findById(req.user.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                success: true,
                message: 'Profile retrieved successfully',
                data: { user },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while retrieving profile',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Update user profile
     */
    static async updateProfile(req, res) {
        try {
            const userId = req.user.userId;
            const updateData = req.body;

            const updatedUser = await UserModel.updateUser(userId, updateData);
            
            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: { user: updatedUser },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error while updating profile',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Change password
     */
    static async changePassword(req, res) {
        try {
            const userId = req.user.userId;
            const { currentPassword, newPassword } = req.body;

            await UserModel.changePassword(userId, currentPassword, newPassword);

            res.json({
                success: true,
                message: 'Password changed successfully. Please log in again.',
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Change password error:', error);
            
            if (error.message.includes('incorrect') || error.message.includes('not found')) {
                return res.status(400).json({
                    success: false,
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }

            res.status(500).json({
                success: false,
                message: 'Internal server error while changing password',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Verify token (for client-side token validation)
     */
    static async verifyToken(req, res) {
        try {
            // If we reach here, token is valid (middleware already verified it)
            const user = await UserModel.findById(req.user.userId);
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found',
                    timestamp: new Date().toISOString()
                });
            }

            res.json({
                success: true,
                message: 'Token is valid',
                data: {
                    user,
                    tokenExpiration: new Date(req.user.exp * 1000)
                },
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('Verify token error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error during token verification',
                timestamp: new Date().toISOString()
            });
        }
    }
}

// Export blacklist for middleware usage
AuthController.tokenBlacklist = tokenBlacklist;

module.exports = AuthController;
