// controllers/admin/admin.product.controller.js
const Product = require('../../models/product.model');
const Category = require('../../models/category.model');
const Brand = require('../../models/brand.model');
const slugify = require('slugify');
const { indexProduct, removeProduct } = require('../../services/search/elastic.service');

// Hàm helper để render (tránh lặp code)
function render(res, view, data) {
    res.render("layouts/admin", {
        body: `pages/admin/${view}`,
        ...data,
    });
}

// 1. Hiển thị Danh sách Sản phẩm (GET /admin/products)
const listProducts = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = 15;
        const skip = (page - 1) * limit;
        
        // Lấy tham số từ query
        const q = (req.query.q || '').trim();
        const filterBrand = req.query.brand || '';
        const filterCategory = req.query.category || '';

        let where = {};
        
        // 1. Lọc theo từ khóa (Search)
        if (q) {
            const searchRegex = new RegExp(q, 'i');
            where.$or = [
                { name: searchRegex },
                { slug: searchRegex },
                { 'variants.sku': searchRegex }
            ];
        }

        // 2. Lọc theo Thương hiệu
        if (filterBrand) {
            where.brandId = filterBrand;
        }

        // 3. Lọc theo Danh mục
        if (filterCategory) {
            where.categoryIds = filterCategory;
        }

        // Thực hiện query song song
        const [products, totalProducts, brands, categories] = await Promise.all([
            Product.find(where)
                .populate('brandId', 'name')
                .populate('categoryIds', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(where),
            // Lấy danh sách để đổ vào dropdown (chỉ cần lấy 1 lần hoặc cache, nhưng ở đây lấy luôn cho đơn giản)
            Brand.find().sort({ name: 1 }).lean(),
            Category.find().sort({ name: 1 }).lean()
        ]);

        const totalPages = Math.max(1, Math.ceil(totalProducts / limit));
        const pagination = { page, totalPages, totalProducts, limit };

        // === TRẢ VỀ JSON NẾU LÀ AJAX (Live Search) ===
        if (req.xhr) {
            return res.json({
                ok: true,
                products,
                pagination,
                q,
                // Trả về các giá trị filter hiện tại để client biết (nếu cần)
                filterBrand,
                filterCategory
            });
        }

        // === RENDER HTML NẾU TẢI TRANG THƯỜNG ===
        render(res, 'products', {
            title: 'Quản lý sản phẩm',
            products,
            pagination,
            q,
            // Truyền dữ liệu cho Dropdown
            brands, 
            categories,
            filterBrand,
            filterCategory
        });

    } catch (err) {
        if (req.xhr) {
            return res.status(500).json({ ok: false, message: "Lỗi máy chủ" });
        }
        next(err);
    }
};

// 2. Hiển thị Form Thêm/Sửa (GET /admin/products/form)
const getProductForm = async (req, res) => {
    const { id } = req.params;
    let product = null;
    let isEditing = false;

    // Lấy tất cả danh mục và thương hiệu
    const [categories, brands] = await Promise.all([
        Category.find().sort({ name: 1 }).lean(),
        Brand.find().sort({ name: 1 }).lean()
    ]);

    if (id) {
        // Chế độ Sửa
        isEditing = true;
        product = await Product.findById(id).lean();
        if (!product) {
            req.flash('error', 'Không tìm thấy sản phẩm.');
            return res.redirect('/admin/products');
        }
    }

    render(res, 'product-form', {
        title: isEditing ? `Sửa sản phẩm: ${product.name}` : 'Thêm sản phẩm mới',
        product: product,
        categories: categories,
        brands: brands,
        isEditing: isEditing
    });
};

// 3. Xử lý Thêm/Sửa Sản phẩm (POST /admin/products/save)
const saveProduct = async (req, res) => {
    const { id, name, brandId, shortDesc, longDesc, basePrice } = req.body;
    
    // Lấy categoryIds, đảm bảo là 1 mảng
    let categoryIds = req.body.categoryIds || [];
    if (!Array.isArray(categoryIds)) {
        categoryIds = [categoryIds];
    }
    
    // Lấy variants
    const variants = [];
    if (req.body.sku && Array.isArray(req.body.sku)) {
        for (let i = 0; i < req.body.sku.length; i++) {
            if (req.body.sku[i]) {
                variants.push({
                    sku: req.body.sku[i],
                    color: req.body.color[i] || null,
                    size: req.body.size[i] || null,
                    price: parseFloat(req.body.price[i]) || 0,
                    stock: parseInt(req.body.stock[i], 10) || 0,
                    // (Chúng ta sẽ xử lý upload ảnh sau)
                    images: [] 
                });
            }
        }
    }

    let imagePaths = [];
    if (req.files && req.files.length > 0) {
        // req.files là một mảng các file đã upload
        // Chúng ta cần lấy 'path' và chuẩn hóa nó
        imagePaths = req.files.map(file => {
            // file.path trả về vd: "public/uploads/products/images-12345.jpg"
            // Chúng ta lưu "uploads/products/images-12345.jpg"
            return file.path.replace('public/', '');
        });
    }

    // Dữ liệu chung
    const payload = {
        name,
        slug: slugify(name, { lower: true, strict: true }),
        brandId,
        categoryIds,
        shortDesc,
        longDesc,
        basePrice: parseFloat(basePrice) || 0,
        variants,
        // (Chúng ta sẽ xử lý upload ảnh chính sau)
        images: imagePaths,
    };

    try {
        if (id) {
            if (imagePaths.length === 0) {
                const oldProduct = await Product.findById(id).select('images').lean();
                payload.images = oldProduct.images || [];
            }
            
            // Cập nhật
            await Product.findByIdAndUpdate(id, payload);
            indexProduct(id);
            req.flash('success', 'Cập nhật sản phẩm thành công.');
        } else {
            // Thêm mới
            const newProduct = await Product.create(payload);
            indexProduct(newProduct._id);
            req.flash('success', 'Thêm sản phẩm mới thành công.');
        }
        res.redirect('/admin/products');
    } catch (err) {
        console.error("Lỗi saveProduct:", err);
        req.flash('error', 'Lỗi lưu sản phẩm: ' + err.message);
        res.redirect('back');
    }
};

// 4. Xử lý Xóa Sản phẩm (POST /admin/products/:id/delete)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await Product.findByIdAndDelete(id);
        removeProduct(id);
        req.flash('success', 'Đã xóa sản phẩm thành công.');
    } catch (err) {
        req.flash('error', 'Không thể xóa sản phẩm.');
    }
    res.redirect('/admin/products');
};


module.exports = {
    listProducts,
    getProductForm,
    saveProduct,
    deleteProduct
};