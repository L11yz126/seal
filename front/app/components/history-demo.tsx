"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Download, Trash2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Image from "next/image"
import { ListItem } from "@/types"

export function HistoryDemo() {
  const [history, setHistory] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const [selectedRecord, setSelectedRecord] = useState<ListItem>()
  const [showPreview, setShowPreview] = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/history?page=${page}&limit=5&search=${searchTerm}`)

      if (!response.ok) throw new Error("获取历史记录失败")

      const data = await response.json()

      setHistory(data.records || [])
      setTotalPages(data.totalPages || 1)
      setTotalRecords(data.totalRecords || 0)
    } catch (error: any) {
      console.error("Error fetching history:", error)
      toast({
        title: "获取历史记录失败",
        description: error?.message || '',
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
    console.log('查列表--')
  }, [page, searchTerm])

  const handleSearch = (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setPage(1) // Reset to first page when searching
    fetchHistory()
  }

  const handleDownload = async (id: number) => {
    try {
      window.open(`/api/history/download?id=${id}`, "_blank")
    } catch (error) {
      console.error("Error downloading file:", error)
      toast({
        title: "下载失败",
        description: "无法下载文件",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id:number) => {
    try {
      const response = await fetch(`/api/history?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("删除记录失败")

      toast({
        title: "删除成功",
        description: "历史记录已删除",
      })

      fetchHistory() // Refresh the list
    } catch (error: any) {
      console.error("Error deleting record:", error)
      toast({
        title: "删除失败",
        description: error?.message || '',
        variant: "destructive",
      })
    }
  }

  const handlePreview = async (id: number) => {
    try {
      const record = history.find((item) => item.id === id)
      setSelectedRecord(record)
      setShowPreview(true)
    } catch (error) {
      console.error("Error previewing record:", error)
      toast({
        title: "预览失败",
        description: "无法加载预览",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">历史记录</h3>
            <form onSubmit={handleSearch} className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="搜索历史记录..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </form>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>文件名</TableHead>
                  <TableHead>处理时间</TableHead>
                  <TableHead>印章数量</TableHead>
                  <TableHead>印章状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                        加载中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                      暂无历史记录
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.filename}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.seals}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${item.status === "有效"
                              ? "bg-green-100 text-green-800"
                              : item.status === "无效"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {item.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handlePreview(item.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDownload(item.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-gray-500">
              显示 {history.length > 0 ? (page - 1) * 5 + 1 : 0}-{Math.min(page * 5, totalRecords)} 共 {totalRecords}{" "}
              条记录
            </p>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              >
                下一页
              </Button>
            </div>
          </div>
        </div>
      </CardContent>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>文件预览</DialogTitle>
            <DialogDescription>
              {selectedRecord?.filename} - {selectedRecord?.date}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative h-64 border rounded-lg overflow-hidden">
              {selectedRecord?.imageUrl ? (
                <Image
                  src={selectedRecord.imageUrl || "/placeholder.svg"}
                  alt="文件预览"
                  fill
                  className="object-contain"
                />
              ) : (
                <Image src="/placeholder.svg?height=400&width=600" alt="文件预览" fill className="object-contain" />
              )}
              {selectedRecord?.status && (
                <div
                  className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs text-white ${selectedRecord.status === "有效"
                      ? "bg-green-500"
                      : selectedRecord.status === "无效"
                        ? "bg-red-500"
                        : "bg-gray-500"
                    }`}
                >
                  {selectedRecord.status}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">印章数量:</span>
                <span>{selectedRecord?.seals || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">可信度:</span>
                <span className={selectedRecord && selectedRecord?.confidence > 90 ? "text-green-600" : "text-amber-600"}>
                  {selectedRecord?.confidence || 0}%
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => handleDownload(selectedRecord?.id || 0)}>
                <Download className="h-4 w-4 mr-2" />
                下载报告
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

