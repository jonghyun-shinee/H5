~(function () {
  // 当屏幕大小改变，让内容自适应
  let winW = document.documentElement.clientWith || document.body.clientWidth
  let desW = 640
  if (winW > 640) {
    document.documentElement.style.fontSize = 100 + 'px'
    return
  }
  document.documentElement.style.fontSize = winW / desW * 100 + 'px'
})()

let loadingContext = (function () {

  // 计算进度条的当前长度
  let n = 0;
  let totalLength = 0;
  let maxDelayTimer

  let loadingPromise = function () {
    return new Promise((resolve) => {
      // 获取所有的图片资源
      $.ajax({
        url: "./img1/result.txt",
        dataType: "json",
        success: resolve
      })
    })
  }
  let maxOverTime = function () {
    // 加载超过90%，跳转至下一页
    if (n / totalLength >= 0.9) {
      done && done()
      return
    }

    alert("您的网络信号质量差，请稍后再试")
    clearTimeout(maxDelayTimer)
    //$(".loadingBox").remove()
  }


  // 如果加载成功，停留一分钟跳转
  let done = () => {
    let delayOneMinute = setTimeout(() => {
      clearTimeout(maxDelayTimer)
      //$(".loadingBox").remove()
      // 隐藏进度条，显示“来电提示”按钮
      $(".loading").hide()
      $(".messageBtn").show()
      clearTimeout(delayOneMinute)

    }, 1000)
  }

  // 给消息按钮绑定点击事件
  let handleCheckCall = () => {
    // 移除loading页，显示来电页面，并且播放铃声
    $(".loadingBox").remove()
    $("#ring")[0].play()

    receivePhone.init()
  }

  

  return {
    init() {

      // 设置超时时间
      maxDelayTimer = setTimeout(maxOverTime, 10000)
      
      let promise = loadingPromise()
        .then((data) => {
          //console.log(data)
          totalLength = data.length

          data.forEach((item) => {
            let img = new Image()
            img.onload = function () {
              img = null
              n++
              $(".currentLoading").css("width", n / totalLength * 100 + '%')
              if (n === totalLength) {
                done && done()
              }
            }
            img.src = item
          })
        })
      

      $(".messageBtn").on("tap", () => {
        handleCheckCall()
      })
    }
  }
})()

// 接通电话页面
let receivePhone = (() => {
  let $bellBox = $(".bellBox"),
    $dura = $(".duration"),
    conversation = $("#conversation")[0]


  let timer = null;
  // 点击 “接听” 显示通话时间和 了解详情 按钮
  let hanleReceivePhone = () => {
    // 计算当前通话时常
    let startTime = 0
    timer = setInterval(() => {
      if (++startTime <= 9) {
        $dura.text('00:0' + startTime)
      } else if (startTime < 60) {
        $dura.text('00:' + startTime)
      } else {
        let divide = startTime / 60
        let yushu = startTime % 60
        if (yushu < 9) {
          yushu = '0' + yushu
        }
        if (divide < 10) {
          divide = '0' + parseInt(startTime)
        }
        $dura.text(divide + ':' + yushu)
      }

    }, 1000);
    $("#ring")[0].pause()
    $(".incomingPhone").hide()
    $dura.show()
    $(".receivePhone").css("bottom", ".3rem")
    conversation.play()
  }


  return {
    init() {
      $bellBox.css("zIndex", 4)
      // 点击接听
      $(".receivebtn").tap(hanleReceivePhone)
      // 点击“了解详情”清除计时器，并跳转至下一页
      $(".hangoutBtn").tap(() => {
        clearInterval(timer)
        conversation.pause()
        $bellBox.remove()

        chattingContext.init()
      })
    }
  }
})()

// chattingRoom
let chattingContext = (() => {
  let $typeIn = $(".typeIn")
  let $messageList = $(".chattingList")
  let $keyboard = $(".keyboard")
  // 键盘是否折叠
  let isFold = true

  let socket = null

  // 产生一个随机数
  let genRandom = (capt, lower, base) => {
    base = capt.length
    let rando1 = Math.floor(Math.random() * base)
    let rando2 = ""
    for (let i = 0; i < 4; i++) {
      rando2 += lower[Math.floor(Math.random() * base)]
    }
    return capt[rando1] + rando2
  }

  let createWS = () => {
    // 创建通信
    socket = io("http://localhost:3000")
    let capt = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]
    let lower = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "g", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
    let username = genRandom(capt, lower)
    let avator = `avator${Math.floor(Math.random() * 8) + 1}.jpg`
    let avator1 = ""
    // 图片加载成功，获取图片数据传递服务器
    let temImg = new Image()
    temImg.onload = () => {
      avator1 = avator
      socket.emit("enterRoom", {
        username,
        avator1
      })
    }
    temImg.src = `../img1/${avator}`

    // 获取登录数据
    socket.on("someoneLogin", (data) => {
      console.log(data)
      if (username !== data.username) {
        let str = `<span class="join">${data.username}加入了群聊</span>`
        $messageList.html($messageList.html() + str)
      }
    })
    // 有人离开
    socket.on('somebodyLeave', (data) => {
      console.log(data)
      let str = `<span class="departing">${data.username}退出了群聊</span>`
      $messageList.html($messageList.html() + str)
    })

    // 接受新的消息
    socket.on('hasNewMessage', (item) => {
      let className = item.username === username ? 'me' : 'others'
      let str = `<li class=${className}>
                    <img src=`+ `../img1/${item.avator}` + ` alt="" class="avator">
                    <i class="arrow"></i>
                    <div class="words">${item.message}</div>
                  </li>`
      // 拼接到messageList
      $messageList.html($messageList.html() + str)
      let keyboardH1
      if (isFold) {
        keyboardH1 = $keyboard.height() + parseFloat($keyboard.css("bottom")) * htmlFontSize
      }
      changeMessagePos(keyboardH1)

    })
  }

  // 获取元素高度
  let messageListH = $messageList.height(),
    screenH = document.documentElement.clientHeight || document.body.clientHeight,
    keyboardH = 0,
    htmlFontSize = parseFloat($(document.documentElement).css("fontSize"))

  // 向消息列表中追加内容
  let addMessage = () => {
    isFold = false
    let messageVal = $typeIn.val()

    // 发消息
    socket.emit('sendmessage', $typeIn.val())

    $typeIn.val('')
    $typeIn[0].focus()

    // // 移动消息列表位置
    // changeMessagePos()
  }

  // 点击文本框获取焦点显示键盘
  let showKeyBoard = () => {
    if (isFold) {
      $keyboard.css("bottom", "-.4rem")
      isFold = false
      changeMessagePos()
    }
  }

  // 改变messageList的位置
  let changeMessagePos = (keyboardH) => {
    keyboardH = keyboardH || $keyboard.height()

    // 获取消息列表的真实高度
    let scrollHeightVal = $messageList[0].scrollHeight
    let minus = screenH - keyboardH
    let scrollTopValue = scrollHeightVal - minus
    // 让元素滚动到指定位置
    $messageList.css("bottom", keyboardH)
    if (scrollHeightVal > minus) {
      $messageList[0].scrollTo(0, scrollHeightVal - $messageList[0].clientHeight)
    }
  }

  // 折叠键盘
  let handleFoldKeyboard = () => {
    $keyboard.css("bottom", "-4.2rem")
    isFold = true
    $typeIn[0].focus()
  }

  return {
    init() {
      // 让消息界面显示
      $(".chattingRoom").css("zIndex", 3)
      $keyboard.css("bottom", "-4.2rem")
      let keyboardH1 = $keyboard.height() + parseFloat($keyboard.css("bottom")) * htmlFontSize
      changeMessagePos(keyboardH1)

      createWS()

      // 点击文本框，根据当前键盘位置是否折叠键盘
      $typeIn.tap(() => {
        showKeyBoard()
      })
      // 点击消息列表区域，折叠键盘
      $messageList.on('tap', () => {
        handleFoldKeyboard()
        changeMessagePos(keyboardH1)
      })

      // 点击enter追加
      $typeIn.on('keyup', (e) => {
        // 按下 enter
        if (e.which === 13) {
          addMessage()
        }
      })

      // 点击发送追加
      $(".submit").tap(addMessage)
      // 当在消息列表用手滑动时，将键盘折叠，重新计算messageList的位置
      $messageList.on('touchstart touchmove touchend', () => {
        if (!isFold) {
          handleFoldKeyboard()
          changeMessagePos(keyboardH1)
        }
      })

      // 点击退出，退出聊天室
      $(".quit").tap(() => {
        socket.disconnect()
        // 移除聊天室
        $(".chattingRoom").remove()
        // 显示魔方界面
        cubeContext.init()
      })

    }
  }
})()

// 魔方盒子
let cubeContext = (() => {

  let $cubeBox = $('.cubeBox'),
    $cube = $('.cube'),
    $li = $cube.children('li')

  // 拖动魔方使其旋转
  let startX,
    startY,
    endX,
    endY

  let rotateCube = (e) => {
    //clientX: 232.8125
    //clientY: 435.9375
    let touchEvent = e.changedTouches[0]
    startX = touchEvent.clientX
    startY = touchEvent.clientY
    //console.log(startX + "=====" + startY)
    $cube.on('touchend', (e) => {
      //console.log(e.changedTouches[0])
      //clientX: 232.8125
      //clientY: 435.9375
      let touchEvent = e.changedTouches[0]
      endX = touchEvent.clientX
      endY = touchEvent.clientY
      //console.log(endX + "=====" + endY)
      let minusX = endX - startX
      let minusY = endY - startY
      // 左右转动
      //console.log(minusX+"-------"+minusY)
      if (Math.abs(minusX) > minusY) {
        $cube.get(0).style.transform = `scale(0.7) rotateX(-20deg) rotateY(${minusX}deg)`
      } else {
        // 上下旋转
        $cube.get(0).style.transform = `scale(0.7) rotateX(${minusY}deg) rotateY(35deg)`
      }
    })
  }
  
  return {
    init() {
      $cubeBox.css("zIndex",5)
      // 转动魔方
      $cube.on('touchstart', rotateCube)
      // 点击cube的每一个面跳转至对应的详情页
      $li.each((index, item)=>{
        if(index===0) {
          $(item).tap(()=>{
            $cubeBox.remove()
            detailBox.init()
          })
        }
      })
    }
  }
})()

let detailBox = (()=>{   
  let $detailBox = $(".detailBox")

  return {
    init() {
      $detailBox.css("display","block")
      var mySwiper = new Swiper('.swiper-container',{
        effect: 'coverflow'
      }) 
    }
  }
})()



loadingContext.init()


// /*以后在真实的项目中，如果页面中有滑动的需求，我们一定要把DOCUMENT本身滑动的默认行为阻止掉（不阻止：浏览器中预览，会触发下拉刷新或者左右滑动切换页卡等功能）*/
// $(document).on('touchstart touchmove touchend', (ev) => {
//   ev.preventDefault();
// // });





