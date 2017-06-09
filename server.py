import _thread
import socket
import urllib.parse

from routes.api_todo import route_dict as api_todo
from routes.routes_static import route_static
from routes.routes_user import route_dict as user_routes
from routes.routes_weibo import route_dict as weibo_routes
from routes.todo import route_dict as todo_routes
from utils import (
    log,
    error,
)


# 定义一个 class 用于保存请求的数据
class Request(object):
    def __init__(self):
        self.method = 'GET'
        self.path = ''
        self.query = {}
        self.body = ''
        self.headers = {}
        self.cookies = {}

    def add_cookies(self):
        """
        height=180; user=zgd
        """
        cookies = self.headers.get('Cookie', '')
        kvs = cookies.split('; ')
        log('cookie', kvs)
        for kv in kvs:
            if '=' in kv:
                k, v = kv.split('=')
                self.cookies[k] = v

    def add_headers(self, header):
        """
        Accept-Language: zh-CN,zh;q=0.8
        Cookie: height=180; user=zgd
        """
        # lines = header.split('\r\n')
        lines = header
        for line in lines:
            k, v = line.split(': ', 1)
            self.headers[k] = v
        self.add_cookies()

    def form(self):
        body = urllib.parse.unquote(self.body)
        args = body.split('&')
        f = {}
        log('form debug', args, len(args))
        for arg in args:
            k, v = arg.split('=')
            f[k] = v
        return f

    def json(self):
        """
        把 body 中的 json 格式字符串解析成 dict 或者 list 并返回
        """
        import json
        return json.loads(self.body)


def parsed_path(path):
    """
    message=hello&author=zgd
    {
        'message': 'hello',
        'author': 'zgd',
    }
    """
    index = path.find('?')
    if index == -1:
        return path, {}
    else:
        path, query_string = path.split('?', 1)
        args = query_string.split('&')
        query = {}
        for arg in args:
            k, v = arg.split('=')
            query[k] = v
        return path, query


def response_for_path(path, request):
    path, query = parsed_path(path)
    request.path = path
    request.query = query
    log('path and query', path, query, request.body)
    """
    根据 path 调用相应的处理函数
    没有处理的 path 会返回 404
    """
    r = {
        '/static': route_static,
    }
    # 注册外部的路由
    r.update(api_todo)
    r.update(user_routes)
    r.update(todo_routes)
    r.update(weibo_routes)
    #
    response = r.get(path, error)
    return response(request)


def process_request(connection):
    r = connection.recv(1100)
    r = r.decode('utf-8')
    log('原始请求request\n{}'.format(r))
    # 防止空请求
    if len(r.split()) < 2:
        connection.close()
    path = r.split()[1]
    # 创建一个新的 request 并设置
    request = Request()
    request.method = r.split()[0]
    request.add_headers(r.split('\r\n\r\n', 1)[0].split('\r\n')[1:])
    request.body = r.split('\r\n\r\n', 1)[1]
    # 用 response_for_path 函数来得到 path 对应的响应内容
    response = response_for_path(path, request)
    connection.sendall(response)
    try:
        log('响应\n', response.decode('utf-8').replace('\r\n', '\n'))
    except Exception as e:
        log('异常', e)
    connection.close()


def run(host='', port=3000):
    """
    启动服务器
    """
    # 初始化 socket
    print('start at', '{}:{}'.format(host, port))
    with socket.socket() as s:
        s.bind((host, port))
        s.listen(3)
        while True:
            connection, address = s.accept()
            print('连接成功, 使用多线程处理请求', address)
            _thread.start_new_thread(process_request, (connection,))


if __name__ == '__main__':
    # 生成配置并且运行程序
    config = dict(
        host='',
        port=3000,
    )
    run(**config)
