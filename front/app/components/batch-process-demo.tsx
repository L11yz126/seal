"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { FileText, CheckCircle, Download, Plus, Trash2, Eye } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useDropzone } from "react-dropzone"
import { FileType } from "@/types"
import { PreviewImg } from "./preview-img"

export function BatchProcessDemo() {
  const [files, setFiles] = useState<FileType[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [batchId, setBatchId] = useState(null)
  const [progress, setProgress] = useState(0)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "application/pdf": [],
    },
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map((file) => ({
        id: Date.now() + Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        status: "waiting",
        result: "等待中",
        sealCount: 0,
      }))
      setFiles((prev) => [...prev, ...newFiles] as unknown as FileType[])
    },
  })

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (batchId) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/batch-process?batchId=${batchId}`)
          if (!response.ok) throw new Error("获取批处理状态失败")

          const data = await response.json()

          // Update files with status from server
          if (data.files) {
            setFiles(data.files)
          }

          // Update progress
          if (data.progress) {
            setProgress(data.progress)
          }

          // If batch processing is complete, clear interval
          if (data.status === "completed") {
            clearInterval(interval)
          }
        } catch (error: any) {
          console.error("Error fetching batch status:", error)
          toast({
            title: "获取状态失败",
            description: error?.message || '',
            variant: "destructive",
          })
        }
      }, 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [batchId])

  const startBatchProcessing = async () => {
    if (files.length === 0) {
      toast({
        title: "请先添加文件",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()

      // 根据后端API要求，使用'files'作为参数名
      files.forEach((fileObj) => {
        formData.append("files", fileObj.file)
      })

      const response = await fetch("/api/batch-process", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("批量处理请求失败")

      const data = await response.json()

      if (data.batchId) {
        setBatchId(data.batchId)

        // Update files status to processing
        setFiles((prev) =>
          prev.map((file) => ({
            ...file,
            status: "processing",
            result: "处理中",
          })),
        )

        toast({
          title: "批处理已开始",
          description: "系统正在处理您的文件",
        })
      }
    } catch (error: any) {
      console.error("Error starting batch process:", error)
      toast({
        title: "批处理失败",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const downloadResult = async (fileId: number) => {
    try {
      window.open(`/api/history/download?id=${fileId}`, "_blank")
    } catch (error) {
      console.error("Error downloading file:", error)
      toast({
        title: "下载失败",
        description: "无法下载文件",
        variant: "destructive",
      })
    }
  }

  const exportAllResults = () => {
    // This would typically create a ZIP of all results
    toast({
      title: "导出所有结果",
      description: "正在准备导出所有结果...",
    })
  }

  const pauseBatchProcessing = async () => {
    if (!batchId) return

    try {
      const response = await fetch(`/api/batch-process/pause?batchId=${batchId}`, {
        method: "POST",
      })

      if (!response.ok) throw new Error("暂停批处理失败")

      toast({
        title: "批处理已暂停",
        description: "您可以稍后继续处理",
      })
    } catch (error: any) {
      console.error("Error pausing batch process:", error)
      toast({
        title: "暂停失败",
        description: error?.message || '',
        variant: "destructive",
      })
    }
  }

  const completedCount = files.filter((file) => file.status === "complete").length

  const handlePreviewImage = (fileId: number) => {
    try {
      // 假设文件处理后，后端会返回图片URL
      // 这里使用文件ID构建图像URL或从文件对象中获取
      const fileToPreview = files.find(f => f.id === fileId)
      if (fileToPreview && fileToPreview.fileUrl) {
        setSelectedImageUrl(fileToPreview.fileUrl)
        setShowPreview(true)
      } else {
        // 如果没有图像URL，可以构建一个基于ID的URL
        setSelectedImageUrl(`/api/history/preview?id=${fileId}`)
        setShowPreview(true)
      }
    } catch (error) {
      console.error("Error previewing file:", error)
      toast({
        title: "预览失败",
        description: "无法预览文件",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">批量处理文件</h3>
            <div className="flex items-center">
              {files.length === 0 && (
                <div {...getRootProps()}>
                    <input {...getInputProps()} />
                    <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    添加文件
                </Button>
                </div>
              )}
              {files.length > 0 && (
                <Button
                  variant="outline" 
                  size="sm" 
              onClick={() => {
                setFiles([]);
                setBatchId(null);
                setProgress(0);
                toast({
                  title: "已清空所有文件",
                  description: "您可以重新添加文件进行处理",
                });
              }}
              className="ml-2"
              disabled={files.length === 0}
            >
                <Trash2 className="h-4 w-4 mr-1" />
                  清空
                </Button>
              )}
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>文件名</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>识别结果</TableHead>
                  <TableHead>印章数量</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                      暂无文件，请添加文件进行批量处理
                    </TableCell>
                  </TableRow>
                ) : (
                  files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-gray-500" />
                          {file.name}
                        </div>
                      </TableCell>
                      {/* <TableCell>{(file.size / 1024 / 1024).toFixed(2)} MB</TableCell> */}
                      <TableCell>
                        {file.status === "complete" && (
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                            <span className="text-sm">完成</span>
                          </div>
                        )}
                        {file.status === "processing" && (
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <span className="text-sm">处理中</span>
                            </div>
                            <Progress value={file.progress || 45} className="h-1.5" />
                          </div>
                        )}
                        {file.status === "waiting" && (
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500">等待中</span>
                          </div>
                        )}
                        {file.status === "error" && (
                          <div className="flex items-center">
                            <span className="text-sm text-red-500">处理失败</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{file.result}</TableCell>
                      <TableCell>
                        {file.status === "complete" ? (
                          <div className="flex items-center">
                            <span className={`text-sm ${file.sealCount > 0 ? "text-green-600" : "text-amber-600"}`}>
                              {file.sealCount}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {file.status === "complete" && (
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handlePreviewImage(file.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => downloadResult(file.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {files.length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">批处理进度</p>
                  <p className="text-xs text-gray-500">
                    {completedCount}/{files.length} 文件已完成
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {!batchId ? (
                    <Button onClick={startBatchProcessing} disabled={isUploading || files.length === 0}>
                      开始处理
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" onClick={pauseBatchProcessing}>
                        {completedCount === files.length ? "已完成" : "暂停"}
                      </Button>
                      {/* <Button size="sm" onClick={exportAllResults} disabled={completedCount === 0}>
                        导出所有结果
                      </Button> */}
                    </>
                  )}
                </div>
              </div>
              <Progress value={progress || (completedCount / files.length) * 100} className="h-2 mt-4" />
            </div>
          )}
        </div>

        {showPreview && selectedImageUrl && (
          <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" 
            onClick={() => setShowPreview(false)}
          >
            <div 
              className="relative max-w-4xl max-h-[90vh] w-full h-full" 
              onClick={(e) => e.stopPropagation()}
            >
              <PreviewImg 
                imageUrl={selectedImageUrl} 
                alt="文件预览" 
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

