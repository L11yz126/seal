import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Download, Trash2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function HistoryDemo() {
  const history = [
    { id: 1, filename: "合同文件.pdf", date: "2025-03-07 14:25", seals: 2, status: "有效" },
    { id: 2, filename: "入职申请.pdf", date: "2025-03-06 10:12", seals: 1, status: "有效" },
    { id: 3, filename: "发票.jpg", date: "2025-03-05 16:45", seals: 1, status: "无效" },
    { id: 4, filename: "证明文件.png", date: "2025-03-04 09:30", seals: 3, status: "有效" },
    { id: 5, filename: "会议纪要.pdf", date: "2025-03-03 11:20", seals: 0, status: "无印章" },
  ]

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">历史记录</h3>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="search" placeholder="搜索历史记录..." className="pl-8" />
            </div>
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
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.filename}</TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.seals}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          item.status === "有效"
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
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-gray-500">显示 1-5 共 5 条记录</p>
            <div className="flex space-x-1">
              <Button variant="outline" size="sm" disabled>
                上一页
              </Button>
              <Button variant="outline" size="sm" disabled>
                下一页
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

