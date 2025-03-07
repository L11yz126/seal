import { NextResponse } from "next/server"
import { SERVER_HOST } from "../config"

export async function POST(request: Request) {
    try {
        const formData = await request.formData()

        // Forward the request to the backend service
        const response = await fetch(`${SERVER_HOST}/api/recognize`, {
            method: "POST",
            body: formData,
        })

        if (!response.ok) {
            throw new Error(`Backend service responded with status: ${response.status}`)
        }

        const data = await response.json()

        return NextResponse.json(data)
    } catch (error) {
        console.error("Error uploading file:", error)
        return NextResponse.json({ error: "Failed to process file" }, { status: 500 })
    }
}

