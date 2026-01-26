"use client";

import { useState } from "react";
import { Sparkle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Placeholder loan parameters - will be updated with exact 12 parameters later
const DEFAULT_PARAMS = {
    monthlyIncome: "75000",
    existingEMIs: "18000",
    loanAmountRequested: "500000",
    loanTenure: "36",
    businessVintage: "4",
    annualTurnover: "1200000",
    creditScore: "720",
    avgBankBalance: "125000",
    gstCompliance: "regular",
    existingLoans: "1",
    propertyOwnership: "owned",
    industryType: "manufacturing"
};

interface ManualInputFormProps {
    onAnalyze: (params: typeof DEFAULT_PARAMS) => void;
    isLoading: boolean;
}

export function ManualInputForm({ onAnalyze, isLoading }: ManualInputFormProps) {
    const [params, setParams] = useState(DEFAULT_PARAMS);

    const updateParam = (key: keyof typeof DEFAULT_PARAMS, value: string) => {
        setParams(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAnalyze(params);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Income Section */}
                <div className="space-y-2">
                    <Label htmlFor="monthlyIncome" className="text-sm font-medium">
                        Monthly Income (₹)
                    </Label>
                    <Input
                        id="monthlyIncome"
                        type="number"
                        value={params.monthlyIncome}
                        onChange={(e) => updateParam("monthlyIncome", e.target.value)}
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="existingEMIs" className="text-sm font-medium">
                        Existing EMIs (₹/month)
                    </Label>
                    <Input
                        id="existingEMIs"
                        type="number"
                        value={params.existingEMIs}
                        onChange={(e) => updateParam("existingEMIs", e.target.value)}
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="loanAmountRequested" className="text-sm font-medium">
                        Loan Amount Requested (₹)
                    </Label>
                    <Input
                        id="loanAmountRequested"
                        type="number"
                        value={params.loanAmountRequested}
                        onChange={(e) => updateParam("loanAmountRequested", e.target.value)}
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="loanTenure" className="text-sm font-medium">
                        Loan Tenure (months)
                    </Label>
                    <Input
                        id="loanTenure"
                        type="number"
                        value={params.loanTenure}
                        onChange={(e) => updateParam("loanTenure", e.target.value)}
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="businessVintage" className="text-sm font-medium">
                        Business Vintage (years)
                    </Label>
                    <Input
                        id="businessVintage"
                        type="number"
                        value={params.businessVintage}
                        onChange={(e) => updateParam("businessVintage", e.target.value)}
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="annualTurnover" className="text-sm font-medium">
                        Annual Turnover (₹)
                    </Label>
                    <Input
                        id="annualTurnover"
                        type="number"
                        value={params.annualTurnover}
                        onChange={(e) => updateParam("annualTurnover", e.target.value)}
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="creditScore" className="text-sm font-medium">
                        Credit Score (CIBIL)
                    </Label>
                    <Input
                        id="creditScore"
                        type="number"
                        value={params.creditScore}
                        onChange={(e) => updateParam("creditScore", e.target.value)}
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="avgBankBalance" className="text-sm font-medium">
                        Avg. Bank Balance (₹)
                    </Label>
                    <Input
                        id="avgBankBalance"
                        type="number"
                        value={params.avgBankBalance}
                        onChange={(e) => updateParam("avgBankBalance", e.target.value)}
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="existingLoans" className="text-sm font-medium">
                        Existing Loans Count
                    </Label>
                    <Input
                        id="existingLoans"
                        type="number"
                        value={params.existingLoans}
                        onChange={(e) => updateParam("existingLoans", e.target.value)}
                        className="h-11"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="gstCompliance" className="text-sm font-medium">
                        GST Filing Status
                    </Label>
                    {/* <Select value={params.gstCompliance} onValueChange={(v) => updateParam("gstCompliance", v)}>
                        <SelectTrigger className="h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="regular">Regular Filer</SelectItem>
                            <SelectItem value="quarterly">Quarterly Filer</SelectItem>
                            <SelectItem value="irregular">Irregular</SelectItem>
                            <SelectItem value="not_registered">Not Registered</SelectItem>
                        </SelectContent>
                    </Select> */}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="propertyOwnership" className="text-sm font-medium">
                        Property Ownership
                    </Label>
                    {/* <Select value={params.propertyOwnership} onValueChange={(v) => updateParam("propertyOwnership", v)}>
                        <SelectTrigger className="h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="owned">Owned</SelectItem>
                            <SelectItem value="rented">Rented</SelectItem>
                            <SelectItem value="family">Family Owned</SelectItem>
                        </SelectContent>
                    </Select> */}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="industryType" className="text-sm font-medium">
                        Industry Type
                    </Label>
                    {/* <Select value={params.industryType} onValueChange={(v) => updateParam("industryType", v)}>
                        <SelectTrigger className="h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="manufacturing">Manufacturing</SelectItem>
                            <SelectItem value="trading">Trading</SelectItem>
                            <SelectItem value="services">Services</SelectItem>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="agriculture">Agriculture</SelectItem>
                        </SelectContent>
                    </Select> */}
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button
                    type="submit"
                    size="lg"
                    className="rounded-full px-8 shadow-lg shadow-primary/20"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>Analyzing...</>
                    ) : (
                        <>
                            <Sparkle className="mr-2 h-4 w-4" />
                            Analyze Loan Readiness
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
