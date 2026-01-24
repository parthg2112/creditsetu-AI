export default function DashboardPage() {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2">
                <h1 className="font-serif text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                    Overview
                </h1>
                <p className="text-muted-foreground">
                    Welcome back, Rahul. Here's what's happening with your loan application.
                </p>
            </div>

            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground bg-slate-100/50 dark:bg-slate-900/50">
                <p>Dashboard content will appear here.</p>
            </div>
        </div>
    );
}
