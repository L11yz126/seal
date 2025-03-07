import { NextResponse } from "next/server"
import { SERVER_HOST } from "../../config"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "Record ID is required" }, { status: 400 })
        }

        const response = await fetch(`${SERVER_HOST}/api/history/${id}/download`)

        if (!response.ok) {
            throw new Error(`Backend service responded with status: ${response.status}`)
        }

        // Get the file content and headers
        const fileData = await response.arrayBuffer()
        const contentType = response.headers.get("content-type") || "application/octet-stream"
        const contentDisposition = response.headers.get("content-disposition") || "attachment"

        // Return the file as a response
        return new NextResponse(fileData, {
            headers: {
                "Content-Type": contentType,
                "Content-Disposition": contentDisposition,
            },
        })
    } catch (error) {
        console.error("Error downloading file:", error)
        return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
    }
}

