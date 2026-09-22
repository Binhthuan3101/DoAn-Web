const { getPool, sql } = require('../config/db');
const jwt = require('jsonwebtoken');

const createOrder = async (req, res) => {
  const { customerName, customerPhone, customerAddress, items } = req.body;

  let userId = null;
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
    } catch (err) {
    }
  }

  if (
    !customerName ||
    !customerPhone ||
    !customerAddress ||
    !Array.isArray(items) ||
    items.length === 0
  ) {
    return res.status(400).json({
      success: false,
      data: null,
      message: 'Dữ liệu đơn hàng không hợp lệ',
    });
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    let totalAmount = 0;

    for (const item of items) {
      const checkResult = await new sql.Request(transaction)
        .input('productId', sql.Int, item.productId)
        .query(`
          SELECT ProductID, ProductName, Price, Stock 
          FROM Products 
          WHERE ProductID = @productId
        `);

      if (checkResult.recordset.length === 0) {
        throw new Error(`Sản phẩm ID ${item.productId} không tồn tại`);
      }

      const product = checkResult.recordset[0];

      if (product.Stock < item.quantity) {
        throw new Error(
          `Sản phẩm "${product.ProductName}" không đủ số lượng tồn kho (còn ${product.Stock})`
        );
      }

      totalAmount += product.Price * item.quantity;
    }

    // Tạo đơn hàng
    const orderResult = await new sql.Request(transaction)
      .input('userId', sql.Int, userId)
      .input('customerName', sql.NVarChar, customerName)
      .input('customerPhone', sql.NVarChar, customerPhone)
      .input('customerAddress', sql.NVarChar, customerAddress)
      .input('totalAmount', sql.Decimal(18, 2), totalAmount)
      .query(`
        INSERT INTO Orders (UserID, CustomerName, CustomerPhone, CustomerAddress, TotalAmount)
        OUTPUT INSERTED.OrderID
        VALUES (@userId, @customerName, @customerPhone, @customerAddress, @totalAmount)
      `);

    const orderId = orderResult.recordset[0].OrderID;

    for (const item of items) {
      const productResult = await new sql.Request(transaction)
        .input('productId', sql.Int, item.productId)
        .query(`SELECT Price FROM Products WHERE ProductID = @productId`);

      const unitPrice = productResult.recordset[0].Price;

      await new sql.Request(transaction)
        .input('orderId', sql.Int, orderId)
        .input('productId', sql.Int, item.productId)
        .input('quantity', sql.Int, item.quantity)
        .input('unitPrice', sql.Decimal(18, 2), unitPrice)
        .query(`
          INSERT INTO OrderDetails (OrderID, ProductID, Quantity, UnitPrice)
          VALUES (@orderId, @productId, @quantity, @unitPrice)
        `);

      await new sql.Request(transaction)
        .input('productId', sql.Int, item.productId)
        .input('quantity', sql.Int, item.quantity)
        .query(`
          UPDATE Products 
          SET Stock = Stock - @quantity, UpdatedAt = GETDATE()
          WHERE ProductID = @productId
        `);
    }

    await transaction.commit();

    res.status(201).json({
      success: true,
      data: { orderId, totalAmount },
      message: 'Đặt hàng thành công!',
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Lỗi createOrder:', error);
    res.status(400).json({
      success: false,
      data: null,
      message: error.message || 'Không thể tạo đơn hàng',
    });
  }
};

const getMyOrders = async (req, res) => {
  try {
    let userId = null;
    const authHeader = req.headers['authorization'];

    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (e) {
        // token lỗi
      }
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Bạn cần đăng nhập',
      });
    }

    const pool = await getPool();

    const orders = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT o.OrderID, o.CustomerName, o.TotalAmount, o.Status, o.OrderDate
        FROM Orders o
        WHERE o.UserID = @userId
        ORDER BY o.OrderDate DESC
      `);

    const details = await pool
      .request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT d.OrderID, p.ProductName, d.Quantity, d.UnitPrice
        FROM OrderDetails d
        JOIN Orders o ON o.OrderID = d.OrderID
        JOIN Products p ON p.ProductID = d.ProductID
        WHERE o.UserID = @userId
      `);

    const data = orders.recordset.map((o) => ({
      ...o,
      items: details.recordset.filter((d) => d.OrderID === o.OrderID),
    }));

    res.json({
      success: true,
      data,
      message: 'Lấy đơn hàng thành công',
    });
  } catch (error) {
    console.error('Lỗi getMyOrders:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Lỗi lấy đơn hàng',
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
};