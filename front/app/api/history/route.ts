import { NextResponse } from "next/server"
import { SERVER_HOST } from "../config"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const page = searchParams.get("page") || "1"
        const limit = searchParams.get("limit") || "10"
        const search = searchParams.get("search") || ""

        // Forward the request to the backend service
        const response = await fetch(`${SERVER_HOST}/api/history?page=${page}&limit=${limit}&search=${search}`)

        if (!response.ok) {
            throw new Error(`Backend service responded with status: ${response.status}`)
        }

        const data = await response.json()

        return NextResponse.json(data)
    } catch (error) {
        console.error("Error fetching history:", error)
        return NextResponse.json({ error: "Failed to fetch history records" }, { status: 500 })
    }
}

// Delete history record
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "Record ID is required" }, { status: 400 })
        }

        const response = await fetch(`${SERVER_HOST}/api/history/${id}`, {
            method: "DELETE",
        })

        if (!response.ok) {
            throw new Error(`Backend service responded with status: ${response.status}`)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting history record:", error)
        return NextResponse.json({ error: "Failed to delete history record" }, { status: 500 })
    }
}

