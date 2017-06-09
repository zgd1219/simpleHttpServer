var timeString = function(timestamp) {
    t = new Date(timestamp * 1000)
    t = t.toLocaleTimeString()
    return t
}

var commentsTemplate = function(comments) {
    var html = ''
    for(var i = 0; i < comments.length; i++) {
        var c = comments[i]
        var id = c.id
        var t = `
            <div data-id="${id}">
                ${c.content}
                <button class="comment-delete">删除</button>
            </div>
        `
        html += t
    }
    return html
}

var WeiboTemplate = function(Weibo) {
    var content = Weibo.content
    var id = Weibo.id
    var comments = commentsTemplate(Weibo.comments)
    var t = `
        <div class='weibo-cell' id='weibo-${id}' data-id=${id}>
            <div class="weibo-content-form">
                <span class="weibo-text">[WEIBO]: ${content}</span>
                <button class="weibo-edit">编辑</button>
                <button class="weibo-delete">删除</button>
            </div>
            <div class="comment-list">
                ${comments}
            </div>
            <div class="comment-form">
                <input type="hidden" name="weibo_id" value="">
                <input name="content" class="comment-text">
                <br>
                <button class="comment-add">添加评论</button>
            </div>
        </div>
    `
    return t
    /*
    上面的写法在 python 中是这样的
    t = """
    <div class="Weibo-cell">
        <button class="Weibo-delete">删除</button>
        <span>{}</span>
    </div>
    """.format(Weibo)
    */
}

var insertWeibo = function(Weibo) {
    var WeiboCell = WeiboTemplate(Weibo)
    // 插入 Weibo-list
    var WeiboList = e('.weibo-list')
    WeiboList.insertAdjacentHTML('beforeend', WeiboCell)
}

var insertComment = function(WeiboCell, comment) {
  var commentList = WeiboCell.querySelector('.comment-list')
  var comments = []
  comments.push(comment)
  var t = commentsTemplate(comments)
  commentList.insertAdjacentHTML('beforeend', t)
}


var insertEditForm = function(cell) {
    var form = `
        <div class='weibo-edit-form'>
            <input class="weibo-edit-input">
            <button class='weibo-update'>更新</button>
        </div>
    `
    cell.insertAdjacentHTML('afterend', form)
}

var loadWeibos = function() {
    // 调用 ajax api 来载入数据
    apiWeiboAll(function(r) {
        // console.log('load all', r)
        // 解析为 数组
        var Weibos = JSON.parse(r)
        // 循环添加到页面中
        for(var i = 0; i < Weibos.length; i++) {
            var Weibo = Weibos[i]
            insertWeibo(Weibo)
        }
    })
}

var bindEventWeiboAdd = function() {
    var b = e('#id-button-add-weibo')
    // 注意, 第二个参数可以直接给出定义函数
    b.addEventListener('click', function(){
        var input = e('#id-input-weibo')
        var content = input.value
        log('click add', content)
        var form = {
            'content': content,
        }
        apiWeiboAdd(form, function(r) {
            // 收到返回的数据, 插入到页面中
            var Weibo = JSON.parse(r)
            insertWeibo(Weibo)
        })
    })
}

var bindEventWeiboDelete = function() {
    var WeiboList = e('.weibo-list')
    // 注意, 第二个参数可以直接给出定义函数
    WeiboList.addEventListener('click', function(event){
        var self = event.target
        // log('target', self)
        if(self.classList.contains('weibo-delete')){
            // 删除这个 Weibo,注意WeiboCell不是self.parentElement,因为上面套了一个div
            var WeiboCell = self.closest('.weibo-cell')
            var Weibo_id = WeiboCell.dataset.id
            apiWeiboDelete(Weibo_id, function(r){
                log('删除成功', Weibo_id)
                WeiboCell.remove()
            })
        }
    })
}

var bindEventWeiboEdit = function() {
  var WeiboList = e('.weibo-list')
  WeiboList.addEventListener('click', function(event){
    var self = event.target
    if(self.classList.contains('weibo-edit')) {
      var WeiboCell = self.parentElement
      insertEditForm(WeiboCell)
    }
  })
}


var bindEventWeiboUpdate = function() {
  var WeiboList = e('.weibo-list')
  WeiboList.addEventListener('click', function(event){
    var self = event.target
    log(self)
    if(self.classList.contains('weibo-update')){
      var editForm = self.parentElement
      var input = editForm.querySelector('.weibo-edit-input')
      var content = input.value
      var WeiboCell = editForm.parentElement
      var id = WeiboCell.dataset.id
      var form = {
        'id': id,
        'content': content,
      }
      log('update form', form)
      apiWeiboUpdate(form, function(r){
        var weibo = JSON.parse(r)
        var contetn = weibo.content
        var WeiboContent = WeiboCell.querySelector('.weibo-text')
        WeiboContent.innerHTML = '[WEIBO]: ' + content
      })
    }
  })
}

var bindEventComentAdd = function(){
  var WeiboList = e('.weibo-list')
  WeiboList.addEventListener('click', function(event){
    var self = event.target
    if(self.classList.contains('comment-add')){
      var commentForm = self.parentElement
      var input = commentForm.querySelector('.comment-text')
      var content = input.value
      var WeiboCell = commentForm.parentElement
      var weibo_id = WeiboCell.dataset.id
      var form = {
        'content' : content,
        'weibo_id': weibo_id,
      }
      apiCommentAdd(form, function(r){
        var comment = JSON.parse(r)
        insertComment(WeiboCell,comment)
      })
    }
  })
}

var bindEventCommentDelete = function() {
  var WeiboList = e('.weibo-list')
  WeiboList.addEventListener('click', function(event){
    var self = event.target
    if(self.classList.contains('comment-delete')) {
      var commentDiv = self.parentElement
      var id = commentDiv.dataset.id
      apiCommentDelete(id, function(r){
        commentDiv.remove()
      })
    }
  })
}



var bindEvents = function() {
   bindEventWeiboAdd()
   bindEventWeiboDelete()
   bindEventWeiboEdit()
   bindEventWeiboUpdate()
   bindEventComentAdd()
   bindEventCommentDelete()
}

var __main = function() {
    bindEvents()
    loadWeibos()
}

__main()
