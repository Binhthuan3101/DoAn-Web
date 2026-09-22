const { getPool } = require('../config/db');

const getCategories = async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT CategoryID, CategoryName, Description
      FROM Categories
      ORDER BY CategoryName
    `);

    res.json({
      success: true,
      data: result.recordset,
      message: 'Lấy danh mục thành công',
    });
  } catch (error) {
    console.error('Lỗi getCategories:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi lấy danh mục',
    });
  }
};

module.exports = { getCategories };