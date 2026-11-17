const router = require('express').Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/productController');

router.get('/search', controller.search);
router.get('/:id', controller.getById);
router.post('/', auth, controller.create);
router.put('/:id', auth, controller.update);
router.delete('/:id', auth, controller.remove);

module.exports = router;
