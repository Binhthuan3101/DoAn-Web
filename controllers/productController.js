const { getPool, sql } = require('../config/db');

const getProducts = async (req, res) => {
  try {
    const { search = '', category = '' } = req.query;
    const pool = await getPool();

    let query = `
      SELECT 
        p.ProductID, 
        p.ProductName, 
        p.Description, 
        p.Price, 
        p.Stock, 
        p.ImageURL, 
        p.CategoryID, 
        c.CategoryName
      FROM Products p
      INNER JOIN Categories c ON p.CategoryID = c.CategoryID
      WHERE 1=1
    `;

    const request = pool.request();

    if (search.trim()) {
      query += ` AND (p.ProductName LIKE @search OR p.Description LIKE @search)`;
      request.input('search', sql.NVarChar, `%${search.trim()}%`);
    }

    if (category.trim()) {
      query += ` AND c.CategoryName = @category`;
      request.input('category', sql.NVarChar, category.trim());
    }

    query += ` ORDER BY p.ProductID DESC`;

    const result = await request.query(query);

    res.json({
      success: true,
      data: result.recordset,
      message: 'Lấy danh sách sản phẩm thành công',
    });
  } catch (error) {
    console.error('Lỗi getProducts:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi server khi lấy sản phẩm',
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`
        SELECT p.*, c.CategoryName
        FROM Products p
        INNER JOIN Categories c ON p.CategoryID = c.CategoryID
        WHERE p.ProductID = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Không tìm thấy sản phẩm',
      });
    }

    res.json({
      success: true,
      data: result.recordset[0],
      message: 'Lấy chi tiết sản phẩm thành công',
    });
  } catch (error) {
    console.error('Lỗi getProductById:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi server',
    });
  }
};
// ===== ADMIN: Thêm sản phẩm =====
const createProduct = async (req, res) => {
  try {
    const { ProductName, Description, Price, Stock, ImageURL, CategoryID } = req.body;
    if (!ProductName || Price == null || !CategoryID) {
      return res.status(400).json({ success: false, data: null, message: 'Thiếu tên, giá hoặc danh mục' });
    }
    const pool = await getPool();
    const result = await pool.request()
      .input('name', sql.NVarChar, ProductName)
      .input('desc', sql.NVarChar, Description || null)
      .input('price', sql.Decimal(18, 2), Price)
      .input('stock', sql.Int, Stock || 0)
      .input('img', sql.NVarChar, ImageURL || null)
      .input('cat', sql.Int, CategoryID)
      .query(`
        INSERT INTO Products (ProductName, Description, Price, Stock, ImageURL, CategoryID)
        OUTPUT INSERTED.*
        VALUES (@name, @desc, @price, @stock, @img, @cat)
      `);
    res.status(201).json({ success: true, data: result.recordset[0], message: 'Thêm sản phẩm thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, data: null, message: error.message || 'Lỗi thêm sản phẩm' });
  }
};

// ===== ADMIN: Sửa sản phẩm =====
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { ProductName, Description, Price, Stock, ImageURL, CategoryID } = req.body;
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, ProductName)
      .input('desc', sql.NVarChar, Description || null)
      .input('price', sql.Decimal(18, 2), Price)
      .input('stock', sql.Int, Stock)
      .input('img', sql.NVarChar, ImageURL || null)
      .input('cat', sql.Int, CategoryID)
      .query(`
        UPDATE Products SET
          ProductName = @name,
          Description = @desc,
          Price = @price,
          Stock = @stock,
          ImageURL = @img,
          CategoryID = @cat,
          UpdatedAt = GETDATE()
        WHERE ProductID = @id;
        SELECT * FROM Products WHERE ProductID = @id;
      `);
    if (!result.recordset.length) {
      return res.status(404).json({ success: false, data: null, message: 'Không tìm thấy sản phẩm' });
    }
    res.json({ success: true, data: result.recordset[0], message: 'Cập nhật thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, data: null, message: error.message || 'Lỗi cập nhật' });
  }
};

// ===== ADMIN: Xóa sản phẩm =====
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    // Kiểm tra đã nằm trong đơn hàng chưa
    const check = await pool.request().input('id', sql.Int, id)
      .query('SELECT TOP 1 OrderDetailID FROM OrderDetails WHERE ProductID = @id');
    if (check.recordset.length) {
      return res.status(400).json({
        success: false, data: null,
        message: 'Không xóa được: sản phẩm đã có trong đơn hàng. Hãy đặt Stock = 0 thay vì xóa.'
      });
    }
    const result = await pool.request().input('id', sql.Int, id)
      .query('DELETE FROM Products WHERE ProductID = @id; SELECT @@ROWCOUNT AS affected');
    if (result.recordset[0].affected === 0) {
      return res.status(404).json({ success: false, data: null, message: 'Không tìm thấy sản phẩm' });
    }
    res.json({ success: true, data: null, message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, data: null, message: error.message || 'Lỗi xóa' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};