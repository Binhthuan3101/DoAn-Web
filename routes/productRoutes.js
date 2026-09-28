const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", createProduct); // Thêm
router.put("/:id", updateProduct); // Sửa
router.delete("/:id", deleteProduct); // Xóa

module.exports = router;
