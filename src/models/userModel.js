const bcrypt = require('bcryptjs');

// In-memory user storage (in production, use a database)
let users = [
    {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        password: '$2a$12$OUMNb4JzLi2aZgM3JyRFr.Z69aAWJ87/aK6QV4UjdzrnGp.uTUcbi', // hashed: 'admin123'
        refreshTokens: [],
        createdAt: new Date(),
        lastLogin: null,
        isActive: true,
        role: 'admin'
    }
];

let nextUserId = 2;

class UserModel {
    static async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    static async createUser(userData) {
        const { username, email, password, role = 'user' } = userData;
        
        // Check if user already exists
        const existingUser = users.find(user => 
            user.email === email || user.username === username
        );
        
        if (existingUser) {
            throw new Error('User with this email or username already exists');
        }

        // Hash password
        const hashedPassword = await this.hashPassword(password);

        const newUser = {
            id: nextUserId++,
            username,
            email,
            password: hashedPassword,
            refreshTokens: [],
            createdAt: new Date(),
            lastLogin: null,
            isActive: true,
            role
        };

        users.push(newUser);
        
        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    }

    static async findByEmail(email) {
        return users.find(user => user.email === email && user.isActive);
    }

    static async findByUsername(username) {
        return users.find(user => user.username === username && user.isActive);
    }

    static async findById(id) {
        const user = users.find(user => user.id === id && user.isActive);
        if (user) {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        return null;
    }

    static async findByCredentials(emailOrUsername) {
        return users.find(user => 
            (user.email === emailOrUsername || user.username === emailOrUsername) && 
            user.isActive
        );
    }

    static async updateLastLogin(userId) {
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            users[userIndex].lastLogin = new Date();
            return true;
        }
        return false;
    }

    static async addRefreshToken(userId, refreshToken) {
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            users[userIndex].refreshTokens.push(refreshToken);
            return true;
        }
        return false;
    }

    static async removeRefreshToken(userId, refreshToken) {
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            users[userIndex].refreshTokens = users[userIndex].refreshTokens.filter(
                token => token !== refreshToken
            );
            return true;
        }
        return false;
    }

    static async removeAllRefreshTokens(userId) {
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            users[userIndex].refreshTokens = [];
            return true;
        }
        return false;
    }

    static async verifyRefreshToken(userId, refreshToken) {
        const user = users.find(user => user.id === userId);
        return user && user.refreshTokens.includes(refreshToken);
    }

    static async getAllUsers() {
        return users.map(user => {
            const { password, refreshTokens, ...userWithoutSensitiveData } = user;
            return userWithoutSensitiveData;
        });
    }

    static async deactivateUser(userId) {
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            users[userIndex].isActive = false;
            users[userIndex].refreshTokens = [];
            return true;
        }
        return false;
    }

    static async updateUser(userId, updateData) {
        const userIndex = users.findIndex(user => user.id === userId);
        if (userIndex !== -1) {
            // Don't allow updating sensitive fields directly
            const { password, refreshTokens, id, ...allowedUpdates } = updateData;
            
            users[userIndex] = { ...users[userIndex], ...allowedUpdates };
            
            const { password: _, refreshTokens: __, ...userWithoutSensitiveData } = users[userIndex];
            return userWithoutSensitiveData;
        }
        return null;
    }

    static async changePassword(userId, currentPassword, newPassword) {
        const user = users.find(user => user.id === userId);
        if (!user) {
            throw new Error('User not found');
        }

        const isCurrentPasswordValid = await this.comparePassword(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        const hashedNewPassword = await this.hashPassword(newPassword);
        const userIndex = users.findIndex(user => user.id === userId);
        users[userIndex].password = hashedNewPassword;
        
        // Remove all refresh tokens to force re-login
        users[userIndex].refreshTokens = [];
        
        return true;
    }
}

module.exports = UserModel;
