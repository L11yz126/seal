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

    def detect_objects(self, image_path):
        """
        执行目标检测并返回检测到的坐标列表。
        参数：
            image_path: 输入图像的路径。
        返回：
            list: 包含检测结果的坐标列表 [x, y, w, h]。
        """
        img = cv2.imread(image_path)
        # 预处理
        img_data, ratio, dw, dh, img_width, img_height = self.pre_image(img)
        # 推理
        outputs = self.session.run(None, {self.input_name: img_data})
        # 后处理
        detections = self.postprocess(outputs, img_width, img_height, ratio, dw, dh)
        return detections, img


ONNX_MODEL_PATH = '/Users/vlou/Desktop/11/seal/runs/train/train4/weights/best.onnx'
yolo_model = YOLO11(ONNX_MODEL_PATH)


def safe_show(name, image):
    resize_height = 1600
    resize_width = 900
    if image.shape[0] > resize_height:
        rate = max(image.shape[0] / resize_height, image.shape[1] / resize_width)
        image = cv2.resize(image, (int(image.shape[1] / rate), int(image.shape[0] / rate)))
    cv2.imshow(name.encode('gbk').decode(errors='ignore'), image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


def infer_start(img_path):
    result_bbox = []
    image = cv2.imread(img_path)
    detections = yolo_model.detect_objects(img_path)

    has_red_seal = len(detections) > 0

    if not has_red_seal:
        1
        return []

    for bbox in detections:
        x_min, y_min, w, h = bbox
        x_max = x_min + w
        y_max = y_min + h
        result_bbox.append([x_min, y_min, x_max, y_max])
        cv2.rectangle(image, (x_min, y_min), (x_max, y_max), (0, 0, 255), 5)
    safe_show("123", image)
    return result_bbox


if __name__ == "__main__":
    infer_start(r"/Users/vlou/Desktop/11/seal/tests/images/test.png")
