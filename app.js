let app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);

app.get('/', (req, res) => {
  console.log(111111111111)
});

let userList = []

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on("enterRoom",(data)=>{
    // 保存登录用户的信息
    console.log(data)
    socket.username = data.username
    socket.avator = data.avator1
    userList.push(data)
    // 服务器广播有人登录
    io.emit("someoneLogin",data)

    // 注意：登录之后才能做下面这些操作
    // 有人离开
    socket.on('disconnect',()=>{
      console.log("有人离开了")
      // 删除离开的用户的信息
      let currentIndex = userList.findIndex((item)=>{
        return item.username === socket.username
      })
      userList.splice(currentIndex,1)
      io.emit('somebodyLeave',{
        username: socket.username,
        avator: socket.avator
      })
    
    })

    // 客户端发送消息
    socket.on('sendmessage',(data)=>{
      console.log(data)
      // 向所有客户端广播
      io.emit("hasNewMessage",{
        username: socket.username,
        avator: socket.avator,
        message: data
      })
    })
  })
});



http.listen(3000, () => {
  console.log('listening on *:3000');
});