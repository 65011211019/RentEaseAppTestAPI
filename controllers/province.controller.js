import ProvinceService from '../services/province.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import httpStatusCodes from '../constants/httpStatusCodes.js';

const ProvinceController = {
    getAll: asyncHandler(async (req, res) => {
        const provinces = await ProvinceService.getAllProvinces();
        res.status(httpStatusCodes.OK).json(
            new ApiResponse(httpStatusCodes.OK, { data: provinces })
        );
    })
};

export default ProvinceController; 