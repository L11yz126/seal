import { NextResponse } from "next/server"
import { SERVER_HOST } from "@/app/api/config"

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const batchId = searchParams.get("batchId")

        if (!batchId) {
            return NextResponse.json({ error: "Batch ID is required" }, { status: 400 })
        }

        // Forward the request to the backend service
        const response = await fetch(`${SERVER_HOST}/api/batch-process/${batchId}/pause`, {
            method: "POST",
        })

        if (!response.ok) {
            throw new Error(`Backend service responded with status: ${response.status}`)
        }

        const data = await response.json()

        return NextResponse.json(data)
    } catch (error) {
        console.error("Error pausing batch process:", error)
        return NextResponse.json({ error: "Failed to pause batch process" }, { status: 500 })
    }
}

