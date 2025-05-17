import { 
    User, 
    Category, 
    Product, 
    Staff, 
    Utilities, 
    initializeEntitySystem 
} from './modules/entities-main.js';

window.cachedCategories = window.cachedCategories || [];

const AdminEntities = {
    initializeUserManagement: User.initializeUserManagement,
    loadUserData: User.loadUserData,
    displayUsers: User.displayUsers,
    setupUserFormSubmission: User.setupUserFormSubmission,
    filterUsers: User.filterUsers,
    
    initializeCategoryManagement: Category.initializeCategoryManagement,
    loadCategoryData: Category.loadCategoryData,
    displayCategories: Category.displayCategories,
    setupCategoryFormSubmission: Category.setupCategoryFormSubmission,
    filterCategories: Category.filterCategories,
    loadCategoriesForDropdown: Category.loadCategoriesForDropdown,
    
    initializeProductManagement: Product.initializeProductManagement,
    loadProductData: Product.loadProductData,
    displayProducts: Product.displayProducts,
    setupProductActions: Product.setupProductActions,
    editProduct: Product.editProduct,
    deleteProduct: Product.deleteProduct,
    setupProductFormSubmission: Product.setupProductFormSubmission,
    checkApiServerStatus: Product.checkApiServerStatus,
    filterProducts: Product.filterProducts,
    ensureCategoriesLoaded: Product.ensureCategoriesLoaded,
    loadProductsByCategory: Product.loadProductsByCategory,
    setupCategoryFilter: Product.setupCategoryFilter,
    
    initializeStaffManagement: Staff.initializeStaffManagement,
    loadStaffData: Staff.loadStaffData,
    displayStaff: Staff.displayStaff,
    setupStaffFormSubmission: Staff.setupStaffFormSubmission,
    filterStaff: Staff.filterStaff
};
window.AdminEntities = AdminEntities;
export default AdminEntities;