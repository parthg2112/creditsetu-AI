export interface Loan {
    id: string;
    bankName: string;
    bankLogo: string;
    interestRate: number;
    maxAmount: string;
    tags: string[];
    processingFee: string;
    prepaymentCharges: string;
    features: string[];
    category: string;
}
