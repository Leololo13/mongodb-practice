const router = require('express').Router();

function loggedIn(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.send('You guys not logged in now');
  }
}

router.use(loggedIn);

router.get('/shirts', (req, res) => {
  res.send('셔츠');
});
router.get('/pants', (req, res) => {
  res.send('바지');
});

module.exports = router;
