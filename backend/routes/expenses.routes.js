const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const expenseController = require('../controllers/expenseController');

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, '../uploads/expenses'),
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const safeName = file.originalname.replace(/\s+/g, '_');
      cb(null, `${timestamp}-${safeName}`);
    },
  }),
});

const router = Router();

router.get('/', expenseController.list);
router.post('/', upload.single('receiptFile'), expenseController.create);
router.get('/summary', expenseController.summary);
router.get('/:id', expenseController.getById);
router.patch('/:id', upload.single('receiptFile'), expenseController.update);
router.delete('/:id', expenseController.delete);

module.exports = router;
