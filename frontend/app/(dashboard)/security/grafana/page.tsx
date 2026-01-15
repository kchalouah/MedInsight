"use client"
import DashboardLayout from "@/components/layout/DashboardLayout"

export default function SecurityGrafanaPage() {
    return (
        <DashboardLayout role="security">
            <div className="h-[80vh] w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl relative">
                <iframe
                    src="http://localhost:3000"
                    className="w-full h-full border-0"
                    title="Grafana Dashboard"
                />
                <div className="absolute top-0 left-0 w-full h-12 bg-slate-800/80 backdrop-blur text-white flex items-center px-6 text-sm font-mono">
                    Monitoring Infrastructure
                </div>
            </div>
        </DashboardLayout>
    )
}
