const Joi = require('joi');

// Password validation schema with strong security requirements
const passwordSchema = Joi.string()
    .min(8)
    .max(128)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)',
        'any.required': 'Password is required'
    });

// Email validation schema
const emailSchema = Joi.string()
    .email({ tlds: { allow: false } })
    .max(254)
    .required()
    .messages({
        'string.email': 'Please provide a valid email address',
        'string.max': 'Email must not exceed 254 characters',
        'any.required': 'Email is required'
    });

// Username validation schema
const usernameSchema = Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
        'string.alphanum': 'Username must contain only alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username must not exceed 30 characters',
        'any.required': 'Username is required'
    });

// Role validation schema
const roleSchema = Joi.string()
    .valid('user', 'admin', 'moderator')
    .default('user')
    .messages({
        'any.only': 'Role must be one of: user, admin, moderator'
    });

// Registration validation schema
const registerSchema = Joi.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Confirm password must match password',
            'any.required': 'Confirm password is required'
        }),
    role: roleSchema.optional()
}).with('password', 'confirmPassword');

// Login validation schema
const loginSchema = Joi.object({
    emailOrUsername: Joi.alternatives()
        .try(
            emailSchema.optional(),
            usernameSchema.optional()
        )
        .required()
        .messages({
            'alternatives.match': 'Please provide a valid email or username',
            'any.required': 'Email or username is required'
        }),
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Password is required'
        }),
    rememberMe: Joi.boolean().default(false)
});

// Refresh token validation schema
const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string()
        .required()
        .messages({
            'any.required': 'Refresh token is required',
            'string.empty': 'Refresh token cannot be empty'
        })
});

// Change password validation schema
const changePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'any.required': 'Current password is required'
        }),
    newPassword: passwordSchema,
    confirmNewPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            'any.only': 'Confirm new password must match new password',
            'any.required': 'Confirm new password is required'
        })
}).with('newPassword', 'confirmNewPassword');

// Reset password request validation schema
const resetPasswordRequestSchema = Joi.object({
    email: emailSchema
});

// Reset password validation schema
const resetPasswordSchema = Joi.object({
    token: Joi.string()
        .required()
        .messages({
            'any.required': 'Reset token is required'
        }),
    newPassword: passwordSchema,
    confirmNewPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            'any.only': 'Confirm new password must match new password',
            'any.required': 'Confirm new password is required'
        })
}).with('newPassword', 'confirmNewPassword');

// Update profile validation schema
const updateProfileSchema = Joi.object({
    username: usernameSchema.optional(),
    email: emailSchema.optional(),
    role: roleSchema.optional()
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

// Validation middleware factory
const createValidationMiddleware = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false,
            stripUnknown: true,
            allowUnknown: false
        });

        if (error) {
            const errorDetails = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context.value
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: errorDetails,
                timestamp: new Date().toISOString()
            });
        }

        // Replace the request property with the validated and sanitized value
        req[property] = value;
        next();
    };
};

// Security validation for sensitive operations
const sensitiveOperationSchema = Joi.object({
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Password confirmation is required for this operation'
        })
});

// Rate limiting validation for API calls
const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().valid('createdAt', 'username', 'email', 'lastLogin').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

module.exports = {
    // Schemas
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    changePasswordSchema,
    resetPasswordRequestSchema,
    resetPasswordSchema,
    updateProfileSchema,
    sensitiveOperationSchema,
    paginationSchema,
    
    // Individual field schemas
    passwordSchema,
    emailSchema,
    usernameSchema,
    roleSchema,
    
    // Middleware factory
    createValidationMiddleware,
    
    // Specific middleware functions
    validateRegister: createValidationMiddleware(registerSchema),
    validateLogin: createValidationMiddleware(loginSchema),
    validateRefreshToken: createValidationMiddleware(refreshTokenSchema),
    validateChangePassword: createValidationMiddleware(changePasswordSchema),
    validateResetPasswordRequest: createValidationMiddleware(resetPasswordRequestSchema),
    validateResetPassword: createValidationMiddleware(resetPasswordSchema),
    validateUpdateProfile: createValidationMiddleware(updateProfileSchema),
    validateSensitiveOperation: createValidationMiddleware(sensitiveOperationSchema),
    validatePagination: createValidationMiddleware(paginationSchema, 'query')
};
