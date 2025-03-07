"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileUpload } from "./file-upload"
import { Loader2, Search, Download, Share } from "lucide-react"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"
import { recognitionType } from "@/types"

export function RecognitionDemo() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [result, setResult] = useState<recognitionType | null>(null)
  const [selectedFile, setSelectedFile] = useState<File| null>()

  const handleFileSelected = (file: File| null) => {
    setSelectedFile(file)
    setIsComplete(false)
    setResult(null)
  }

  const handleProcess = async () => {
    if (!selectedFile) {
      toast({
        title: "请先上传文件",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("上传处理失败")
      }

      const data = await response.json()
      setResult(data)
      setIsComplete(true)
    } catch (error: any) {
      console.error("Error processing file:", error)
      toast({
        title: "处理失败",
        description: error?.message || "文件处理过程中出现错误",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setIsComplete(false)
    setResult(null)
    setSelectedFile(null)
  }

  const handleDownload = async () => {
    if (!result?.id) return

    try {
      window.open(`/api/history/download?id=${result.id}`, "_blank")
    } catch (error) {
      console.error("Error downloading report:", error)
      toast({
        title: "下载失败",
        description: "无法下载报告",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-4">上传文档</h3>
              <FileUpload onFileSelected={handleFileSelected} />
            </div>

            <div className="flex justify-center mt-6">
              <Button onClick={handleProcess} disabled={isProcessing || !selectedFile} className="w-full py-6 text-lg">
                {isProcessing && <Loader2 className="mr-2 h-6 w-6 animate-spin" />}
                {!isProcessing && <Search className="mr-2 h-6 w-6" />}
                {isProcessing ? "处理中..." : "开始识别"}
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-medium mb-4">识别结果</h3>

            {!isComplete ? (
              <div className="border rounded-lg h-80 flex items-center justify-center bg-gray-50">
                <p className="text-gray-500 text-lg">{isProcessing ? "正在识别中..." : "请上传文档并点击识别按钮"}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative h-64 border rounded-lg overflow-hidden">
                  {result?.imageUrl ? (
                    <Image src={result.imageUrl || "/placeholder.svg"} alt="识别结果" fill className="object-contain" />
                  ) : (
                    <Image src="/placeholder.svg?height=400&width=600" alt="识别结果" fill className="object-contain" />
                  )}
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-sm px-3 py-1 rounded-full">
                    已识别
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white p-3">
                    <p className="text-lg font-medium">识别到{result?.sealCount || 1}个印章</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">印章类型:</span>
                    <span className="text-lg">{result?.sealType || "公司公章"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">印章文字:</span>
                    <span className="text-lg">{result?.sealText || "XX科技有限公司"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium">可信度:</span>
                    <span className="text-lg text-green-600 font-semibold">{result?.confidence || 98}%</span>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <Button variant="outline" size="lg" className="flex-1" onClick={handleDownload}>
                    <Download className="mr-2 h-5 w-5" />
                    导出报告
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1">
                    <Share className="mr-2 h-5 w-5" />
                    分享结果
                  </Button>
                </div>

                <Button variant="ghost" size="lg" onClick={handleReset} className="w-full">
                  重新识别
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

