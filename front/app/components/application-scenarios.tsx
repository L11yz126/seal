import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileCheck, FileText, CreditCard, Briefcase, FileSignature, Scale } from "lucide-react"

export function ApplicationScenarios() {
  const scenarios = [
    {
      title: "合同审核",
      icon: FileCheck,
      description: "自动识别和验证合同文件上的公司印章，确保合同的真实性和有效性。",
    },
    { title: "票据验证", icon: CreditCard, description: "快速识别各类票据上的印章，验证其真实性，防止经济损失。" },
    { title: "文档归档", icon: FileText, description: "在大规模文档数字化过程中，自动识别和分类带有印章的重要文件。" },
    { title: "证件核验", icon: Briefcase, description: "识别各类证件上的印章，快速验证证件的真实性和有效性。" },
    { title: "电子签约", icon: FileSignature, description: "验证上传文件中的电子印章，确保电子合同的法律效力。" },
    { title: "法律取证", icon: Scale, description: "快速识别和验证文件上的印章，协助确定文件的真实性和法律效力。" },
  ]

  return (
    <section className="mt-12">
      <h2 className="text-xl font-semibold mb-4">应用场景</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {scenarios.map((scenario, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="p-4">
              <CardTitle className="text-base flex items-center">
                <scenario.icon className="h-5 w-5 mr-2 text-primary" />
                {scenario.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-sm text-gray-600">{scenario.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

