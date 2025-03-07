import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { FileText, CheckCircle, Download } from "lucide-react"

export function BatchProcessDemo() {
  const files = [
    { id: 1, name: "合同文件1.pdf", size: "2.4 MB", status: "complete", result: "已识别", confidence: 98 },
    { id: 2, name: "合同文件2.pdf", size: "1.8 MB", status: "complete", result: "已识别", confidence: 95 },
    { id: 3, name: "发票.jpg", size: "0.8 MB", status: "processing", result: "处理中", confidence: 0 },
    { id: 4, name: "证明文件.png", size: "1.2 MB", status: "waiting", result: "等待中", confidence: 0 },
  ]

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">批量处理文件</h3>
            <Button size="sm">添加文件</Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>文件名</TableHead>
                  <TableHead>大小</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>识别结果</TableHead>
                  <TableHead>可信度</TableHead>
                  <TableHead className="w-[100px]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-gray-500" />
                        {file.name}
                      </div>
                    </TableCell>
                    <TableCell>{file.size}</TableCell>
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
                          <Progress value={45} className="h-1.5" />
                        </div>
                      )}
                      {file.status === "waiting" && (
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500">等待中</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{file.result}</TableCell>
                    <TableCell>
                      {file.status === "complete" ? (
                        <div className="flex items-center">
                          <span className={`text-sm ${file.confidence > 90 ? "text-green-600" : "text-amber-600"}`}>
                            {file.confidence}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {file.status === "complete" && (
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium">批处理进度</p>
                <p className="text-xs text-gray-500">2/4 文件已完成</p>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  暂停
                </Button>
                <Button size="sm">导出所有结果</Button>
              </div>
            </div>
            <Progress value={50} className="h-2 mt-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

