// controllers/admin/admin.user.controller.js
const User = require('../../models/user.model');

function render(res, view, data) {
    res.render("layouts/admin", {
        body: `pages/admin/${view}`,
        ...data,
    });
}

// 1. Hiển thị Danh sách User (GET /admin/users)
const listUsers = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = 15;
        const skip = (page - 1) * limit;
        const q = (req.query.q || '').trim();

        // Chỉ tìm 'customer', admin không thể quản lý admin khác
        let where = { roles: 'customer' }; 

        if (q) {
            const searchRegex = new RegExp(q, 'i');
            where.$or = [
                { fullName: searchRegex },
                { email: searchRegex },
                { phone: searchRegex }
            ];
        }

        const [users, totalUsers] = await Promise.all([
            User.find(where)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(where)
        ]);

        const totalPages = Math.max(1, Math.ceil(totalUsers / limit));
        const pagination = { page, totalPages, totalUsers, limit };

        // Kiểm tra AJAX
        if (req.xhr) {
            return res.json({ ok: true, users, pagination, q });
        }
        
        render(res, 'users', {
            title: 'Quản lý người dùng',
            users,
            pagination,
            q
        });
    } catch (err) {
        next(err);
    }
};

// 2. Cập nhật trạng thái Ban (POST /admin/users/:id/toggle-ban)
const toggleBanStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            req.flash('error', 'Không tìm thấy người dùng.');
            return res.redirect('/admin/users');
        }

        // Admin không thể tự ban mình hoặc ban admin khác
        if (user.roles.includes('admin')) {
            req.flash('error', 'Không thể thay đổi trạng thái của Admin.');
            return res.redirect('/admin/users');
        }

        // Lật ngược trạng thái
        user.isBanned = !user.isBanned;
        await user.save();

        req.flash('success', `Đã ${user.isBanned ? 'khóa' : 'mở khóa'} tài khoản ${user.email}.`);
        return res.redirect('/admin/users');

    } catch (err) {
        req.flash('error', 'Cập nhật thất bại.');
        return res.redirect('/admin/users');
    }
};

// 3. Hiển thị Form Sửa User (GET /admin/users/:id)
const getUserForm = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).lean();
        
        if (!user || user.roles.includes('admin')) {
            req.flash('error', 'Không tìm thấy người dùng hoặc không có quyền sửa.');
            return res.redirect('/admin/users');
        }

        render(res, 'user-form', {
            title: `Sửa người dùng: ${user.email}`,
            user: user
        });

    } catch (err) {
        next(err);
    }
};

// 4. Xử lý Cập nhật User (POST /admin/users/:id/save)
const saveUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { fullName, phone } = req.body;

        const user = await User.findById(id);
        if (!user || user.roles.includes('admin')) {
            req.flash('error', 'Không tìm thấy người dùng hoặc không có quyền sửa.');
            return res.redirect('/admin/users');
        }
        
        user.fullName = fullName;
        user.phone = phone;
        // (Chúng ta có thể thêm logic đổi mật khẩu cho user tại đây nếu cần)

        await user.save();
        req.flash('success', 'Cập nhật thông tin người dùng thành công.');
        res.redirect('/admin/users');

    } catch (err) {
        req.flash('error', 'Cập nhật thất bại: ' + err.message);
        res.redirect('back');
    }
};

module.exports = {
    listUsers,
    toggleBanStatus,
    getUserForm,
    saveUser,
};