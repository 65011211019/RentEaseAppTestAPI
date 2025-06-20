import ProvinceModel from '../models/province.model.js';

const ProvinceService = {
    async getAllProvinces() {
        return ProvinceModel.findAll();
    }
};

export default ProvinceService; 