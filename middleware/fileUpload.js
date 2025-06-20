import multer from 'multer';
import { ApiError } from '../utils/apiError.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    console.log('File filter checking:', file.originalname, file.mimetype);
    
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    }
});

export const uploadSingleFile = (fieldName) => (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    uploadMiddleware(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return next(new ApiError(httpStatusCodes.BAD_REQUEST, 'File is too large. Max 5MB allowed.'));
            }
            return next(new ApiError(httpStatusCodes.BAD_REQUEST, err.message));
        } else if (err) {
            return next(new ApiError(httpStatusCodes.BAD_REQUEST, err.message));
        }
        next();
    });
};

export const uploadMultipleFields = (fields) => {
    // ตรวจสอบว่า fields เป็น array และมีค่าที่ถูกต้อง
    if (!Array.isArray(fields) || fields.length === 0) {
        throw new Error('Invalid fields configuration');
    }

    // สร้าง multer fields configuration
    const multerFields = fields.map(field => ({
        name: field.name,
        maxCount: field.maxCount || 1
    }));

    return (req, res, next) => {
        console.log('Upload middleware processing fields:', multerFields);
        console.log('Request Content-Type:', req.headers['content-type']);
        
        // ตรวจสอบ Content-Type ก่อน
        const contentType = req.headers['content-type'];
        if (!contentType) {
            return next(new ApiError(
                httpStatusCodes.BAD_REQUEST, 
                'Content-Type header is missing. Please set it to multipart/form-data'
            ));
        }
        
        if (!contentType.includes('multipart/form-data')) {
            return next(new ApiError(
                httpStatusCodes.BAD_REQUEST, 
                `Content-Type must be multipart/form-data, got: ${contentType}`
            ));
        }
        
        const uploadMiddleware = upload.fields(multerFields);
        
        uploadMiddleware(req, res, (err) => {
            if (err) {
                console.error('Multer error details:', {
                    message: err.message,
                    code: err.code,
                    field: err.field,
                    stack: err.stack
                });
                
                // Handle specific multer errors
                if (err instanceof multer.MulterError) {
                    switch (err.code) {
                        case 'LIMIT_FILE_SIZE':
                            return next(new ApiError(httpStatusCodes.BAD_REQUEST, 'File is too large. Max 5MB allowed.'));
                        case 'LIMIT_FILE_COUNT':
                            return next(new ApiError(httpStatusCodes.BAD_REQUEST, 'Too many files uploaded.'));
                        case 'LIMIT_UNEXPECTED_FILE':
                            return next(new ApiError(httpStatusCodes.BAD_REQUEST, `Unexpected field: ${err.field}`));
                        case 'LIMIT_PART_COUNT':
                            return next(new ApiError(httpStatusCodes.BAD_REQUEST, 'Too many parts in form data.'));
                        case 'LIMIT_FIELD_KEY':
                            return next(new ApiError(httpStatusCodes.BAD_REQUEST, 'Field name too long.'));
                        case 'LIMIT_FIELD_VALUE':
                            return next(new ApiError(httpStatusCodes.BAD_REQUEST, 'Field value too long.'));
                        case 'LIMIT_FIELD_COUNT':
                            return next(new ApiError(httpStatusCodes.BAD_REQUEST, 'Too many fields in form data.'));
                        default:
                            return next(new ApiError(httpStatusCodes.BAD_REQUEST, `Upload error: ${err.message}`));
                    }
                }
                
                // Handle busboy/multipart parsing errors
                if (err.message.includes('Malformed part header') || 
                    err.message.includes('Invalid form data') ||
                    err.message.includes('Unexpected end of form')) {
                    return next(new ApiError(
                        httpStatusCodes.BAD_REQUEST, 
                        'Invalid multipart form data. Please ensure:\n' +
                        '1. Content-Type is set to multipart/form-data\n' +
                        '2. Form data is properly formatted\n' +
                        '3. File fields use correct field names (e.g., new_images[])\n' +
                        '4. Text fields are properly separated from file fields'
                    ));
                }
                
                return next(new ApiError(httpStatusCodes.BAD_REQUEST, `Upload error: ${err.message}`));
            }

            console.log('Files received:', req.files);
            console.log('Body received:', req.body);

            // ตรวจสอบว่ามีไฟล์ที่จำเป็นครบหรือไม่ (เฉพาะสำหรับ required fields)
            if (req.files) {
                const missingFiles = fields.filter(field => {
                    const files = req.files[field.name];
                    return !files || files.length === 0;
                });

                if (missingFiles.length > 0) {
                    console.log('Missing files:', missingFiles);
                    // Don't throw error for optional fields like images[]
                    if (!missingFiles.some(f => f.name === 'images[]' || f.name === 'new_images[]')) {
                        return next(new ApiError(
                            httpStatusCodes.BAD_REQUEST,
                            `Missing required files: ${missingFiles.map(f => f.name).join(', ')}`
                        ));
                    }
                }
            }

            next();
        });
    };
}; 