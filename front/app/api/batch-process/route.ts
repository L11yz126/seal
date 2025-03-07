import { NextResponse } from "next/server"
import { SERVER_HOST } from "../config"

export async function POST(request: Request) {
    try {
        const formData = await request.formData()

        // Forward the request to the backend service
        const response = await fetch(`${SERVER_HOST}/api/batch-process`, {
            method: "POST",
            body: formData,
        })

        if (!response.ok) {
            throw new Error(`Backend service responded with status: ${response.status}`)
        }

        const data = await response.json()

        return NextResponse.json(data)
    } catch (error) {
        console.error("Error processing batch files:", error)
        return NextResponse.json({ error: "Failed to process batch files" }, { status: 500 })
    }
}

// Get batch processing status
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const batchId = searchParams.get("batchId")

        if (!batchId) {
            return NextResponse.json({ error: "Batch ID is required" }, { status: 400 })
        }

        const response = await fetch(`${SERVER_HOST}/api/batch-process/status?batchId=${batchId}`)

        if (!response.ok) {
            throw new Error(`Backend service responded with status: ${response.status}`)
        }

        const data = await response.json()

        return NextResponse.json(data)
    } catch (error) {
        console.error("Error getting batch status:", error)
        return NextResponse.json({ error: "Failed to get batch status" }, { status: 500 })
    }
}

