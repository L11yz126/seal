# YOLO11检测印章
# 类外定义类别映射关系，使用字典格式
import cv2
import onnxruntime as ort
import numpy as np

CLASS_NAMES = {
    0: 'seal'
}


class YOLO11:
    """
    YOLO11 目标检测模型类，用于处理推理和可视化。
    """

    def __init__(self, onnx_model_path, input_size=(640, 640), confidence_thres=0.7, iou_thres=0.45):
        """
        初始化 YOLO11 类的实例。
        参数：
            onnx_model_path: ONNX 模型的路径。
            input_size: 模型训练时的输入尺寸 (height, width)。
            confidence_thres: 用于过滤检测结果的置信度阈值。
            iou_thres: 非极大值抑制（NMS）的 IoU（交并比）阈值。
        """
        self.onnx_model_path = onnx_model_path
        self.input_size = input_size  # 模型训练时的输入尺寸
        self.confidence_thres = confidence_thres
        self.iou_thres = iou_thres

        # 加载 ONNX 模型
        self.session = ort.InferenceSession(
            self.onnx_model_path,
            providers=["CUDAExecutionProvider", "CPUExecutionProvider"] if ort.get_device() == "GPU" else [
                "CPUExecutionProvider"],
        )

        # 获取模型的输入名称
        self.input_name = self.session.get_inputs()[0].name

    def pre_image(self, img):
        """
        对输入图像进行预处理，以便进行推理。
        参数：
            img: 输入图像。
        返回：
            image_data: 经过预处理的图像数据，准备进行推理。
            ratio: 缩放比例。
            dw, dh: 填充的宽度和高度。
            img_width, img_height: 原始图像的宽度和高度。
        """
        # 获取输入图像的高度和宽度
        img_height, img_width = img.shape[:2]

        # 将图像颜色空间从 BGR 转换为 RGB
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # 保持宽高比，进行 letterbox 填充，使用模型要求的输入尺寸
        img, ratio, (dw, dh) = self.letterbox(img, new_shape=self.input_size)

        # 通过除以 255.0 来归一化图像数据
        image_data = np.array(img) / 255.0

        # 将图像的通道维度移到第一维
        image_data = np.transpose(image_data, (2, 0, 1))  # 通道优先

        # 扩展图像数据的维度，以匹配模型输入的形状
        image_data = np.expand_dims(image_data, axis=0).astype(np.float32)

        return image_data, ratio, dw, dh, img_width, img_height

    @staticmethod
    def letterbox(img, new_shape=(640, 640), color=(114, 114, 114), auto=False, scaleFill=False, scaleup=True):
        """
        将图像进行 letterbox 填充，保持纵横比不变，并缩放到指定尺寸。
        """
        shape = img.shape[:2]  # 当前图像的宽高

        if isinstance(new_shape, int):
            new_shape = (new_shape, new_shape)

        # 计算缩放比例
        r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])  # 选择宽高中最小的缩放比
        if not scaleup:  # 仅缩小，不放大
            r = min(r, 1.0)

        # 缩放后的未填充尺寸
        new_unpad = (int(round(shape[1] * r)), int(round(shape[0] * r)))

        # 计算需要的填充
        dw, dh = new_shape[1] - new_unpad[0], new_shape[0] - new_unpad[1]  # 计算填充的尺寸
        dw, dh = int(np.mod(dw, 2) / 2), int(np.mod(dh, 2) / 2)  # 确保整数填充

        # 缩放图像
        if shape[::-1] != new_unpad:  # 如果当前图像尺寸不等于 new_unpad，则缩放
            img = cv2.resize(img, new_unpad, interpolation=cv2.INTER_LINEAR)

        # 为图像添加边框以达到目标尺寸
        top, bottom = dh, new_shape[0] - new_unpad[1] - dh
        left, right = dw, new_shape[1] - new_unpad[0] - dw
        img = cv2.copyMakeBorder(img, top, bottom, left, right, cv2.BORDER_CONSTANT, value=color)

        return img, (r, r), (dw, dh)

    def postprocess(self, outputs, img_width, img_height, ratio, dw, dh):
        """
        对模型输出进行后处理，以提取边界框、分数和类别 ID。
        参数：
            outputs: 模型的输出。
            img_width: 原始图像宽度。
            img_height: 原始图像高度。
            ratio: 缩放比例。
            dw: 水平填充。
            dh: 垂直填充。
        返回：
            list: 包含检测结果的坐标列表 [x, y, w, h]。
        """
        # 转置并压缩输出，以匹配预期形状
        outputs = np.transpose(np.squeeze(outputs[0]))
        rows = outputs.shape[0]
        boxes, scores, class_ids = [], [], []

        for i in range(rows):
            classes_scores = outputs[i][4:]
            max_score = np.amax(classes_scores)
            if max_score >= self.confidence_thres:
                class_id = np.argmax(classes_scores)
                x, y, w, h = outputs[i][0], outputs[i][1], outputs[i][2], outputs[i][3]

                # 将框调整到原始图像尺寸，考虑缩放和填充
                x -= dw  # 移除填充
                y -= dh
                x /= ratio[0]  # 缩放回原图
                y /= ratio[1]
                w /= ratio[0]
                h /= ratio[1]
                left = int(x - w / 2)
                top = int(y - h / 2)
                width = int(w)
                height = int(h)

                boxes.append([left, top, width, height])
                scores.append(max_score)
                class_ids.append(class_id)

        indices = cv2.dnn.NMSBoxes(boxes, scores, self.confidence_thres, self.iou_thres)
        detections = [boxes[i] for i in indices]
        return detections
    
        filtered_boxes = []
        for box in detections:
            if all(self._calc_distance(box,exist_box) >self.min_seal_distance
                   for exist_box in filtered_boxes):
                filtered_boxes.append(box)
        return filtered_boxes
    
    def _calc_distance(box1, box2):
        """计算两个印章中心点间距"""
        x1 = box1[0] + box1[2]/2
        y1 = box1[1] + box1[3]/2
        x2 = box2[0] + box2[2]/2
        y2 = box2[1] + box2[3]/2
        return np.sqrt((x1-x2)**2 + (y1-y2)**2)


    def detect_objects(self, image_path):
        """
        执行目标检测并返回检测到的坐标列表。
        参数：
            image_path: 输入图像的路径。
        返回：
            tuple: (检测框列表, 印章数量, 图像对象)
        """
        try:
            # 读取图像
            img = cv2.imread(image_path)
            if img is None:
                raise FileNotFoundError(f"无法读取图像: {image_path}")
            
            # 预处理
            img_data, ratio, dw, dh, img_width, img_height = self.pre_image(img)
            
            # 推理
            outputs = self.session.run(None, {self.input_name: img_data})
            
            # 后处理
            detections = self.postprocess(outputs, img_width, img_height, ratio, dw, dh)
            
            # 正确返回（确保return在函数体内）
            return detections, img

        except Exception as e:
            print(f"检测出错: {str(e)}")
            return [], None


    
  
    
    def batch_detect(self, img_list, workers=4):
        """多线程批量检测"""
        with ThreadPoolExecutor(max_workers=workers) as executor:
            results = list(executor.map(self.detect_objects, img_list))
        return [{
            "path": path,
            "count": count,
            "boxes": boxes,
            "timestamp": datetime.now().isoformat()
        } for (boxes, count, _), path in zip(results, img_list)]


ONNX_MODEL_PATH = '/Users/vlou/Desktop/11/seal/runs/train/train3/weights/best.onnx'
# ONNX_MODEL_PATH = 'E:/beshe/yinzhang/ultralytics/runs/train/train3/weights/best.onnx'
yolo_model = YOLO11(ONNX_MODEL_PATH)


def visualize_results(image, detections, count):
    """增强可视化功能"""
    # 绘制检测框
    for (x, y, w, h) in detections:
        cv2.rectangle(image, (x, y), (x+w, y+h), (0,0,255), 3)
    
    # 添加数量统计信息
    cv2.putText(image, f"Seals: {count}", (20, 60), 
               cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0,255,0), 3)
    
    # 添加统计图表
    chart = generate_count_chart(count)
    image[10:160, -170:-10] = cv2.resize(chart, (160, 150))
    
    return image

def generate_count_chart(count):
    """生成统计饼图"""
    fig = plt.figure(figsize=(2,2), dpi=80)
    plt.pie([count, 1], labels=["", ""], colors=["#ff9999", "white"], 
           wedgeprops={'edgecolor':'black'})
    plt.title(f"Total: {count}", fontsize=10)
    fig.canvas.draw()
    img = np.frombuffer(fig.canvas.tostring_rgb(), dtype=np.uint8)
    img = img.reshape(fig.canvas.get_width_height()[::-1] + (3,))
    plt.close()
    return cv2.cvtColor(img, cv2.COLOR_RGB2BGR)

def save_results(img_path, count, boxes):
    """保存检测结果到JSON"""
    result = {
        "image_path": img_path,
        "timestamp": datetime.now().isoformat(),
        "seal_count": count,
        "boxes": [{"x":x, "y":y, "w":w, "h":h} for (x,y,w,h) in boxes]
    }
    with open("detection_logs.json", "a") as f:
        f.write(json.dumps(result) + "\n")

def infer_start(img_path, show_result=True):
    """增强版检测流程"""
    try:
        # 执行检测
        detections, count, image = yolo_model.detect_objects(img_path)
        
        if count == 0:
            print("未检测到印章")
            return 0
        
        # 可视化与保存
        visualized_img = visualize_results(image.copy(), detections, count)
        save_results(img_path, count, detections)
        
        if show_result:
            safe_show("Detection Result", visualized_img)
            
        return count
        
    except Exception as e:
        print(f"处理失败: {str(e)}")
        return -1

def safe_show(name, image):
    """自适应显示窗口"""
    max_height = 900
    if image.shape[0] > max_height:
        ratio = max_height / image.shape[0]
        image = cv2.resize(image, (int(image.shape[1]*ratio), max_height))
    cv2.imshow(name, image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

if __name__ == "__main__":
    # 单图检测
    test_img = r"E:\beshe\1.jpg"
    seal_count = infer_start(test_img)
    print(f"检测到 {seal_count} 个印章")
    
    # 批量检测示例
    # batch_results = yolo_model.batch_detect(["img1.jpg", "img2.jpg"])
    # print(f"批量检测结果: {batch_results}")