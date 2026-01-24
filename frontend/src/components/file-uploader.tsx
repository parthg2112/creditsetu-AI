"use client"

import { useState } from "react"
import { FileText, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

export function FileUploader() {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [result, setResult] = useState<any>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setResult(null)
            setProgress(0)
        }
    }

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        setProgress(10)

        const formData = new FormData()
        formData.append("file", file)

        try {
            // Mock progress since we don't have real upload progress events easily with fetch
            const interval = setInterval(() => {
                setProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(interval)
                        return 90
                    }
                    return prev + 10
                })
            }, 500)

            const response = await fetch("/api/python/audit-loan", {
                method: "POST",
                body: formData,
            })

            clearInterval(interval)

            if (!response.ok) {
                throw new Error("Upload failed")
            }

            const data = await response.json()
            setResult(data)
            setProgress(100)
            toast.success("Analysis complete!")
        } catch (error) {
            console.error(error)
            toast.error("Something went wrong. Please try again.")
            setProgress(0)
        } finally {
            setUploading(false)
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-bold text-center">Upload Loan Documents</CardTitle>
                <CardDescription className="text-center">Upload a bank statement (PDF) for AI analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid w-full max-w-sm items-center gap-1.5 mx-auto">
                    <Label htmlFor="document">Document</Label>
                    <Input id="document" type="file" accept=".pdf" onChange={handleFileChange} disabled={uploading} className="cursor-pointer" />
                </div>

                {file && (
                    <div className="flex items-center gap-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <span className="truncate font-medium">{file.name}</span>
                        <span className="text-xs text-slate-400 ml-auto">{(file.size / 1024).toFixed(0)} KB</span>
                    </div>
                )}

                {uploading && (
                    <div className="space-y-2">
                        <Progress value={progress} className="h-2" />
                        <p className="text-xs text-center text-muted-foreground animate-pulse">Analyzing document...</p>
                    </div>
                )}

                {result && (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800 font-semibold">Ready</AlertTitle>
                        <AlertDescription className="text-green-700">
                            Analysis triggered successfully.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
            <CardFooter>
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleUpload} disabled={!file || uploading}>
                    {uploading ? "Analyzing..." : "Start Audit"}
                </Button>
            </CardFooter>
        </Card>
    )
}
