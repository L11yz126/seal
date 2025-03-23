"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Download, Trash2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { PreviewImg } from "./preview-img"
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
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/history?page=${page}&limit=5&search=${searchTerm}`)

      if (!response.ok) throw new Error("获取历史记录失败")

      const data = await response.json()

      setHistory(data.records || [])
      setTotalPages(data.totalPages || 1)
      setTotalRecords(data.totalRecords || 0)
      // 重置选中状态
      setSelectedIds([])
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

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/history/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("删除记录失败")

      toast({
        title: "删除成功",
        description: "历史记录已删除",
      })

      // 如果在删除后当前页面没有数据了，需要返回上一页（除非已经是第一页）
      if (history.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        fetchHistory() // 刷新当前页面数据
      }
    } catch (error: any) {
      console.error("Error deleting record:", error)
      toast({
        title: "删除失败",
        description: error?.message || '',
        variant: "destructive",
      })
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return

    try {
      const response = await fetch(`/api/history/batch`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: selectedIds }),
      })

      if (!response.ok) throw new Error("批量删除记录失败")

      toast({
        title: "批量删除成功",
        description: `已删除 ${selectedIds.length} 条记录`,
      })

      // 如果删除了当前页所有记录，且不是第一页，则返回上一页
      if (selectedIds.length >= history.length && page > 1) {
        setPage(page - 1)
      } else {
        fetchHistory() // 刷新列表
      }
    } catch (error: any) {
      console.error("Error batch deleting records:", error)
      toast({
        title: "批量删除失败",
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

  const toggleSelectAll = () => {
    if (selectedIds.length === history.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(history.map(item => item.id))
    }
  }

  const toggleSelectItem = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium">历史记录</h3>
              {selectedIds.length > 0 && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleBatchDelete}
                  className="flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除选中 ({selectedIds.length})
                </Button>
              )}
            </div>
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
                  <TableHead className="w-10">
                    {!loading && history.length > 0 && (
                      <Checkbox 
                        checked={selectedIds.length === history.length && history.length > 0} 
                        onCheckedChange={toggleSelectAll}
                      />
                    )}
                  </TableHead>
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
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                        加载中...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                      暂无历史记录
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.includes(item.id)}
                          onCheckedChange={() => toggleSelectItem(item.id)}
                        />
                      </TableCell>
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

      {showPreview && selectedRecord && (
        <div 
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" 
          onClick={() => setShowPreview(false)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full h-full" 
            onClick={(e) => e.stopPropagation()}
          >
            <PreviewImg 
              imageUrl={selectedRecord.imageUrl || ""} 
              alt={selectedRecord.filename || "文件预览"} 
            />
            
            {selectedRecord?.status && (
              <div
                className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs text-white ${
                  selectedRecord.status === "有效"
                    ? "bg-green-500"
                    : selectedRecord.status === "无效"
                      ? "bg-red-500"
                      : "bg-gray-500"
                }`}
              >
                {selectedRecord.status}
              </div>
            )}
            
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-3 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-lg">{selectedRecord.filename}</span>
                <span>{selectedRecord.date}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="font-medium">印章数量: <span className="text-green-400">{selectedRecord?.seals || 0}</span></span>
                </div>
                {/* <div className="flex justify-between">
                  <span className="font-medium">可信度:</span>
                  <span className={selectedRecord?.confidence > 90 ? "text-green-400" : "text-amber-400"}>
                    {selectedRecord?.confidence || 0}%
                  </span>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

