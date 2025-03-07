import { Home, Info, Settings, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DemoNavbar() {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="container mx-auto py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg">印章识别技术演示</span>
          </div>

          <nav>
            <ul className="flex items-center space-x-4">
              <li>
                <Button variant="ghost" size="sm" className="text-primary-foreground">
                  <Home className="h-4 w-4 mr-2" />
                  首页
                </Button>
              </li>
              <li>
                <Button variant="ghost" size="sm" className="text-primary-foreground">
                  <Info className="h-4 w-4 mr-2" />
                  关于
                </Button>
              </li>
              <li>
                <Button variant="ghost" size="sm" className="text-primary-foreground">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  帮助
                </Button>
              </li>
              <li>
                <Button variant="ghost" size="sm" className="text-primary-foreground">
                  <Settings className="h-4 w-4 mr-2" />
                  设置
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}

