import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

export function TechBackground() {
  return (
    <section className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>印章识别技术背景</CardTitle>
          <CardDescription>了解印章识别技术的原理与应用</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">技术原理</h3>
              <p className="text-gray-600 mb-4">
                印章识别技术是基于计算机视觉和深度学习的文档处理技术，主要用于自动识别文档上的印章，验证其真实性，并提取相关信息。该技术结合了图像处理、特征提取、模式识别和深度学习等多种技术。
              </p>
              <h3 className="text-lg font-medium mb-2">核心算法</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>图像预处理：动态尺寸匹配、色彩空间优化、数据增强策略</li>
                <li>印章定位：检测模型架构、位置回归机制</li>
                <li>特征提取：深度可卷积分离、特征增强模块</li>
                <li>印章匹配：特征编码体系</li>
                <li>创新技术突破：动态特征金字塔</li>

              </ul>
            </div>
            <div className="flex flex-col space-y-4">
              <div className="relative h-64 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/%E6%8F%A1%E6%89%8B.jpg-BVENoeuBZgpsYHYqe6lOa1YzHzgEQw.jpeg"
                  alt="合同签署场景"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

