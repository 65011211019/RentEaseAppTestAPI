import CategoryModel from '../models/category.model.js';

const CategoryService = {
    async getCategories(filters = {}) {
        return CategoryModel.findAll(filters);
    }
};

export default CategoryService; 