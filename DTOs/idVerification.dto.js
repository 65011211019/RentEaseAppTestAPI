import Joi from 'joi';

// ENUM values for document types
const ID_DOCUMENT_TYPES = ['national_id', 'passport', 'other'];

// File validation rules
const FILE_VALIDATION = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg']
};

export const idVerificationSchema = Joi.object({
    id_document_type: Joi.string()
        .valid('national_id', 'passport', 'other')
        .required()
        .messages({
            'any.only': 'Document type must be one of: national_id, passport, other',
            'any.required': 'Document type is required'
        }),
    id_document_number: Joi.string()
        .required()
        .messages({
            'string.empty': 'Document number is required',
            'any.required': 'Document number is required'
        })
});

export const validateIdVerificationFiles = (files) => {
    const errors = [];
    
    // Check if all required files are present
    if (!files.id_document || !files.id_document_back || !files.id_selfie) {
        errors.push('All required files (ID front, ID back, and selfie) must be uploaded');
        return errors;
    }

    // Validate each file
    const validateFile = (file, fieldName) => {
        if (!file[0]) return;
        
        const fileObj = file[0];
        
        // Check file size
        if (fileObj.size > FILE_VALIDATION.MAX_SIZE) {
            errors.push(`${fieldName} file size must be less than 5MB`);
        }
        
        // Check file type
        if (!FILE_VALIDATION.ALLOWED_TYPES.includes(fileObj.mimetype)) {
            errors.push(`${fieldName} must be a valid image file (JPEG, PNG)`);
        }
    };

    validateFile(files.id_document, 'ID document front');
    validateFile(files.id_document_back, 'ID document back');
    validateFile(files.id_selfie, 'Selfie');

    return errors;
}; 