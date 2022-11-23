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

let db;
MongoClient.connect(
  'mongodb+srv://leo_admin:rmsgur13@main.9cfoapa.mongodb.net/?retryWrites=true&w=majority',
  function (err, client) {
    if (err) return console.log(err);
    //서버띄우는 코드 여기로 옮기기

    db = client.db('todoapp'); //db정의

    ////////// add하기
    app.post('/add', (req, res) => {
      db.collection('counter').findOne({ name: 'post_num' }, (err, data) => {
        const totalPost = data.totalPost;
        db.collection('post').insertOne(
          {
            _id: totalPost + 1,
            title: req.body.title,
            date: req.body.date,
            content: req.body.content,
          },
          (err, data) => {
            db.collection('counter').updateOne(
              { name: 'post_num' },
              { $inc: { totalPost: 1 } },
              (err, data) => {}
            );
            console.log('upload to server complete');
          }
        );

        res.send('전송완료');
      });
    });

    ////delete
    app.delete('/delete', (req, res) => {
      req.body._id = parseInt(req.body._id);
      db.collection('post').deleteOne(req.body, (err, data) => {
        if (err) return console.log(err);
        return res.json({ success: 'deleted complete', status: 200 });
      });
    });

    /////////////
    app.listen('8080', function () {
      console.log('listening on 8080');
    });
  }
);

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendfile(__dirname + '/index.html');
});
app.get('/write', (req, res) => {
  res.sendfile(__dirname + '/write.html');
});

app.get('/list', (req, res) => {
  db.collection('post')
    .find()
    .toArray((err, data) => {
      res.render('list.ejs', { posts: data });
    });
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
  console.log(id);
  db.collection('post').findOne({ _id: id }, (err, data) => {
    res.render('detail.ejs', { post: data });
  });
});
