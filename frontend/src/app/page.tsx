import { FileUploader } from "@/components/file-uploader";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="z-10 w-full max-w-5xl flex flex-col items-center justify-between font-mono text-sm">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-center text-slate-900 dark:text-slate-100 tracking-tight">
          LendReady AI
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-12 text-center max-w-lg">
          Automated SME Loan Auditing & Gap Analysis
        </p>
      </div>
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500">
        <FileUploader />
      </div>
    </main>
  );
}
