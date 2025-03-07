from flask import Flask, request, jsonify

app = Flask(__name__)

# 这是你要运行的现有 Python 代码
def your_python_code(params):
    # 示例处理逻辑
    result = f"处理完成: {params}"
    return {"status": "success", "data": result}

# 定义接收点击的接口
@app.route('/trigger', methods=['POST'])
def handle_click():
    # 获取前端传递的参数
    data = request.json
    # 执行你的代码
    response = your_python_code(data.get('input'))
    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True)  # 启动服务