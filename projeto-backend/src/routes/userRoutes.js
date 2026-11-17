const router = require('express').Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/userController');

router.post('/token', controller.token);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.put('/:id', auth, controller.update);
router.delete('/:id', auth, controller.remove);

module.exports = router;
