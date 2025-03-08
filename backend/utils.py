import io
import cv2
import numpy as np

def numpy_to_buffer(image_array: np.ndarray, format: str = 'PNG') -> io.BytesIO:
    """
    将 numpy 数组转换为内存 buffer
    
    参数:
        image_array: np.ndarray - 图像数据数组（支持二维灰度或三维RGB数组）
        format: str - 输出格式（支持 PNG/JPEG 等）
        
    返回:
        io.BytesIO - 包含图像数据的字节流
        
    示例:
        buffer = numpy_to_buffer(np.array([[0, 255], [255, 0]]), 'PNG')
    """
    try:
        # 确保数据类型为 uint8
        if image_array.dtype != np.uint8:
            # 自动归一化处理
            image_array = cv2.normalize(
                image_array, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)

        # 转换颜色空间（如果是单通道）
        if len(image_array.shape) == 2:
            image_array = cv2.cvtColor(image_array, cv2.COLOR_GRAY2RGB)

        # 使用 OpenCV 编码图像
        success, encoded_image = cv2.imencode(
            f'.{format.lower()}', image_array)

        if not success:
            raise ValueError("图像编码失败，请检查数组格式")

        return io.BytesIO(encoded_image.tobytes())

    except Exception as e:
        raise RuntimeError(f"Buffer转换失败: {str(e)}")
