import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DemoNavbar } from "./components/demo-navbar"
import { AppNavbar } from "./components/app-navbar"
import { TechBackground } from "./components/tech-background"
import { RecognitionDemo } from "./components/recognition-demo"
import { BatchProcessDemo } from "./components/batch-process-demo"
import { HistoryDemo } from "./components/history-demo"
import { ApplicationScenarios } from "./components/application-scenarios"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DemoNavbar />
      <AppNavbar />

      <main className="container mx-auto py-6 px-4 md:px-6">
        <h1 className="text-3xl font-bold text-center mb-8">印章识别系统</h1>

        <TechBackground />

        <section className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">功能演示</h2>

          <Tabs defaultValue="recognition" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recognition">单文件识别</TabsTrigger>
              <TabsTrigger value="batch">批量处理</TabsTrigger>
              <TabsTrigger value="history">历史记录</TabsTrigger>
            </TabsList>
            <TabsContent value="recognition" className="mt-6">
              <RecognitionDemo />
            </TabsContent>
            <TabsContent value="batch" className="mt-6">
              <BatchProcessDemo />
            </TabsContent>
            <TabsContent value="history" className="mt-6">
              <HistoryDemo />
            </TabsContent>
          </Tabs>
        </section>

        <ApplicationScenarios />
      </main>

      <footer className="bg-gray-100 py-6 mt-12">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 印章识别系统 by11 </p>
        </div>
      </footer>
    </div>
  )
}

