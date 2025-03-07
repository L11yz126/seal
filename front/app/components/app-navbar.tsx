import { FileText, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AppNavbar() {
  return (
    <div className="bg-gray-100 border-b">
      <div className="container mx-auto">
        <nav className="flex overflow-x-auto">
          <Button variant="ghost" className="px-4 py-2 flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            文档识别
          </Button>
          <Button variant="ghost" className="px-4 py-2 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            安全设置
          </Button>
        </nav>
      </div>
    </div>
  )
}

