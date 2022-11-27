///node.js express 설치 후

const express = require('express');
const app = express();

///body-parser library install 후에 설정해야함
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

//mongodb install 후 기본 설정
const MongoClient = require('mongodb').MongoClient;
//ejs 사용하기
app.set('view engine', 'ejs');
//method-override 사용하기

const methodOverride = require('method-override');
app.use(methodOverride('_method'));

//env사용하기  ======dotenv 설치 후 이용
require('dotenv').config();

let db;
MongoClient.connect(process.env.DB_URL, function (err, client) {
  if (err) return console.log(err);
  //서버띄우는 코드 여기로 옮기기

  db = client.db('todoapp'); //db정의

  /////////////
  app.listen(process.env.PORT, function () {
    console.log('listening on 8080');
  });
});

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendfile(__dirname + '/index.html');
});
app.get('/write', (req, res) => {
  res.sendfile(__dirname + '/write.html');
});

//edit page 로 move
app.get('/edit/:id', (req, res) => {
  let id = parseInt(req.params.id);

  db.collection('post').findOne({ _id: id }, (err, data) => {
    res.render('edit.ejs', { post: data });
  });
});
//edit 클릭시 실제 db를 서버에요청해서 바꿈
app.put('/edit', (req, res) => {
  db.collection('post').updateOne(
    { _id: parseInt(req.body.id) },
    {
      $set: {
        title: req.body.title,
        date: req.body.date,
        content: req.body.content,
      },
    },
    (err, data) => {
      res.redirect('/list');
    }
  );
});

//detail page  params 이용해서 id get
app.get('/detail/:id', (req, res) => {
  let id = parseInt(req.params.id);

  db.collection('post').findOne({ _id: id }, (err, data) => {
    res.render('detail.ejs', { post: data });
  });
});

//search page
app.get('/search', (req, res) => {
  new Date();
  let searchInput = req.query.value;
  let searchCondition = [
    {
      $search: {
        index: 'titleSearchs',
        text: {
          query: searchInput,
          path: ['title', 'content'],
        },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 10 },
    { $project: { title: 1 } },
  ];
  db.collection('post')
    .aggregate(searchCondition)
    .toArray((err, data) => {
      res.render('search.ejs', { posts: data });
    });
});

/////////login~~~
////session 이용한 login 방식
///미들웨어,? 웹서버는 요청-응답해주는 machine. 미들웨어는 요청과 응답중간에서 실행되는 코드!!
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');

app.use(
  session({ secret: '비밀코드', resave: true, saveUninitialized: false })
);
app.use(passport.initialize());
app.use(passport.session());
//login page
app.get('/login', (req, res) => {
  console.log('login page');
  res.render('login.ejs');
});

//login 검사하는 함수. 순서 알기 id.pw를 주면 검사(미들웨어)를 하고, 통과하면 res로 응답호출
app.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/fail',
  }),
  (req, res) => {
    res.redirect('/');
  }
);

//위에서 미들웨어가 검사는하지만 실제로 뭔가해주는게 아님. 그래서 로컬스트레티지 인증을 이용함
/// strategy 를 인증하는 방법이라고 부름

passport.use(
  new LocalStrategy(
    {
      usernameField: 'id',
      passwordField: 'pw',
      session: true,
      passReqToCallback: false, ///사용자가 입력한 id외의 정보들. email이나 이름 등등을 가지고 정보를 검증할시
      // ex 파라미터가 1개 더생김. 그래서 id.pw. parameter 로 인증~~
    },
    (id, pw, done) => {
      db.collection('login').findOne({ id: id }, (err, data) => {
        if (err) return done(err);
        if (!data)
          return done(null, false, { message: 'ID가 존재하지 않습니다.' });
        if ((pw = data.pw)) {
          return done(null, data);
        } else {
          return done(null, false, { alert: 'password wrong' });
        }
      });
    }
  )
);

//login 후에 my page

app.get('/mypage', loggedIn, (req, res) => {
  res.render('mypage.ejs', { user: req.user });
});

function loggedIn(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.send('You guys not logged in now');
  }
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

////user가 가진 여러 정보를 de가 분해해서 여러정보를 얻어옴
passport.deserializeUser((id, done) => {
  db.collection('login').findOne({ id: id }, (err, data) => {
    done(null, data);
  });
});

//////sign up page
app.get('/signup', (req, res) => {
  console.log('login page');
  res.render('signup.ejs');
});
/////////Register function

app.post('/register', (req, res) => {
  function checkEngNum(str) {
    const regExp = /[a-zA-Z0-9]/g;
    if (regExp.test(str)) {
      return true;
    } else {
      return false;
    }
  }

  let userData = {
    id: req.body.id,
    pw: req.body.pw,
    name: req.body.name,
    email: req.body.email,
    registerDate: new Date(),
  };
  ///////////////login
  db.collection('login').findOne({ id: req.body.id }, (err, data) => {
    if (!data) {
      checkEngNum(userData.id)
        ? db.collection('login').insertOne(userData, (err, data) => {
            res.redirect('/list');
          })
        : console.log(
            'ID입력이 잘못되었습니다, 영어,숫자의 조합으로 입력해주십시오'
          );
    } else {
      console.log('중복된 아이디가 있습니다');
    }
  });
});

///////////////addddddddd
app.post('/add', loggedIn, (req, res) => {
  db.collection('counter').findOne({ name: 'post_num' }, (err, data) => {
    const totalPost = data.totalPost;
    let writeInfo = {
      title: req.body.title,
      date: req.body.date,
      content: req.body.content,
      id: req.user.id,
      _id: totalPost + 1,
      writtenDate: new Date(),
    };
    if (!writeInfo.title) {
      console.log('타이틀을 입력해주십시오');
    }
    if (!writeInfo.content) {
      console.log('내용을 입력해주십시오');
    } else {
      db.collection('post').insertOne(writeInfo, (err, data) => {
        db.collection('counter').updateOne(
          { name: 'post_num' },
          { $inc: { totalPost: 1 } },
          (err, data) => {}
        );
        console.log('upload to server complete');
      });
      res.send('전송완료');
    }
  });
});

////delete
app.delete('/delete', loggedIn, function (req, res) {
  req.body._id = parseInt(req.body._id);
  let userInfo = { _id: req.body._id, id: req.user.id };

  db.collection('post').deleteOne(userInfo, (err, data) => {
    if (err) return err;
    res.send('삭제되었습니다');
  });
});

/////로그인 후 list 에서는 userid를 받아서 edit, delte버튼 보여주기

app.get('/list', (req, res) => {
  db.collection('post')
    .find()
    .toArray((err, data) => {
      if (req.user) {
        res.render('list.ejs', { posts: data, user: req.user });
      } else {
        res.render('list.ejs', { posts: data, user: 'none' });
      }
    });
});
