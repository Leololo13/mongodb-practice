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
let db;
MongoClient.connect(
  'mongodb+srv://leo_admin:rmsgur13@main.9cfoapa.mongodb.net/?retryWrites=true&w=majority',
  function (err, client) {
    if (err) return console.log(err);
    //서버띄우는 코드 여기로 옮기기

    db = client.db('todoapp'); //db정의

    app.post('/add', (req, res) => {
      db.collection('counter').findOne({ name: 'post_num' }, (err, result) => {
        const totalPost = result.totalPost;
        db.collection('post').insertOne(
          {
            _id: totalPost + 1,
            title: req.body.title,
            date: req.body.date,
            content: req.body.content,
          },
          (err, result) => {
            db.collection('counter').updateOne(
              { name: 'post_num' },
              { $inc: { totalPost: 1 } },
              (err, result) => {}
            );
            console.log('upload to server completed');
          }
        );

        res.send('전송완료');
      });
    });

    // db.collection('post').insertOne(
    //   {
    //     title: 'hi',
    //     date: '2222',
    //     content: 'hiiiiii',
    //   },
    //   (err, res) => {
    //     console.log('saved complete');
    //   }
    // ); //추가

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
    .toArray((err, result) => {
      res.render('list.ejs', { posts: result });
    });
});
// app.post('/add', (req, res) => {
//   res.send('전송완료');
//   console.log(req.body);
// });
