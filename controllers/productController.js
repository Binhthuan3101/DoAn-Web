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

module.exports = {
  getProducts,
  getProductById,
};