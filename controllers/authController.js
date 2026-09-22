const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');

const register = async (req, res) => {
  try {
    const { fullName, email, phone, password, address } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Vui lòng nhập đầy đủ Họ tên, Email và Mật khẩu',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Mật khẩu phải có ít nhất 6 ký tự',
      });
    }

    const pool = await getPool();

    // Kiểm tra email đã tồn tại chưa
    const checkEmail = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query('SELECT UserID FROM Users WHERE Email = @email');

    if (checkEmail.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Email này đã được sử dụng',
      });
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Thêm user mới
    const result = await pool
      .request()
      .input('fullName', sql.NVarChar, fullName)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone || null)
      .input('address', sql.NVarChar, address || null)
      .input('password', sql.NVarChar, hashedPassword)
      .query(`
        INSERT INTO Users (FullName, Email, Phone, Address, Password)
        OUTPUT INSERTED.UserID, INSERTED.FullName, INSERTED.Email
        VALUES (@fullName, @email, @phone, @address, @password)
      `);

    const user = result.recordset[0];

    // Tạo token
    const token = jwt.sign(
      {
        userId: user.UserID,
        email: user.Email,
        fullName: user.FullName,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          userId: user.UserID,
          fullName: user.FullName,
          email: user.Email,
        },
      },
      message: 'Đăng ký thành công!',
    });
  } catch (error) {
    console.error('Lỗi register:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi server khi đăng ký',
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Vui lòng nhập Email và Mật khẩu',
      });
    }

    const pool = await getPool();

    const result = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query(`
        SELECT UserID, FullName, Email, Password, Phone, Address
        FROM Users
        WHERE Email = @email
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Email hoặc mật khẩu không đúng',
      });
    }

    const user = result.recordset[0];

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Email hoặc mật khẩu không đúng',
      });
    }

    // Tạo token
    const token = jwt.sign(
      {
        userId: user.UserID,
        email: user.Email,
        fullName: user.FullName,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          userId: user.UserID,
          fullName: user.FullName,
          email: user.Email,
          phone: user.Phone,
          address: user.Address,
        },
      },
      message: 'Đăng nhập thành công!',
    });
  } catch (error) {
    console.error('Lỗi login:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi server khi đăng nhập',
    });
  }
};

// Lấy thông tin user hiện tại (dùng token)
const getMe = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .input('userId', sql.Int, req.user.userId)
      .query(`
        SELECT UserID, FullName, Email, Phone, Address
        FROM Users
        WHERE UserID = @userId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Không tìm thấy người dùng',
      });
    }

    res.json({
      success: true,
      data: result.recordset[0],
      message: 'Lấy thông tin thành công',
    });
  } catch (error) {
    console.error('Lỗi getMe:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi server',
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
};