import { Loan } from "../types/loan";

export const loanData: Loan[] = [
    // Education Loans
    {
        id: "edu-1",
        bankName: "HDFC Bank",
        bankLogo: "/bank/HDFCBank.jpg",
        interestRate: 8.55,
        maxAmount: "₹50L",
        tags: ["No Collateral", "Instant"],
        processingFee: "1% of loan amount",
        prepaymentCharges: "2% after 6 months",
        features: [
            "100% financing for top universities",
            "Tax benefits under 80E",
            "Moratorium period available",
            "Quick online approval"
        ],
        category: "education"
    },
    {
        id: "edu-2",
        bankName: "Axis Bank",
        bankLogo: "🏛️",
        interestRate: 9.25,
        maxAmount: "₹40L",
        tags: ["Quick Approval", "Low Rate"],
        processingFee: "Zero",
        prepaymentCharges: "Nil",
        features: [
            "No collateral up to 40L",
            "Flexible repayment options",
            "Cover tuition + living costs",
            "Co-applicant required"
        ],
        category: "education"
    },
    {
        id: "edu-3",
        bankName: "SBI",
        bankLogo: "/bank/sbi.webp",
        interestRate: 7.85,
        maxAmount: "₹1.5Cr",
        tags: ["Govt. Bank", "Best Rate"],
        processingFee: "₹10,000",
        prepaymentCharges: "Zero",
        features: [
            "Lowest interest rates",
            "Study in India & Abroad",
            "Up to 15 years tenure",
            "Parent as co-borrower"
        ],
        category: "education"
    },
    {
        id: "edu-4",
        bankName: "ICICI Bank",
        bankLogo: "/bank/ICICIBank.jpg",
        interestRate: 8.95,
        maxAmount: "₹1Cr",
        tags: ["Digital Process", "Fast Disbursal"],
        processingFee: "0.5% of loan",
        prepaymentCharges: "1% in first year",
        features: [
            "100% paperless process",
            "Competitive interest rates",
            "Insurance cover available",
            "Covers exam fees too"
        ],
        category: "education"
    },
    {
        id: "edu-5",
        bankName: "Kotak Mahindra",
        bankLogo: "/bank/kotakmahindra.jpg",
        interestRate: 9.50,
        maxAmount: "₹30L",
        tags: ["No Collateral", "Flexible EMI"],
        processingFee: "1.5%",
        prepaymentCharges: "3% in first 2 years",
        features: [
            "Covers full cost of education",
            "Simple documentation",
            "Part payment allowed",
            "Study anywhere globally"
        ],
        category: "education"
    },

    // Home Loans
    {
        id: "home-1",
        bankName: "HDFC Home Loans",
        bankLogo: "/bank/HDFC.jpg",
        interestRate: 8.40,
        maxAmount: "₹10Cr",
        tags: ["Market Leader", "Low Rate"],
        processingFee: "0.5% of loan",
        prepaymentCharges: "Zero for floating",
        features: [
            "Up to 90% loan-to-value",
            "Doorstep service available",
            "Balance transfer option",
            "Tax benefits available"
        ],
        category: "home"
    },
    {
        id: "home-2",
        bankName: "SBI Home Loans",
        bankLogo: "/bank/sbi.webp",
        interestRate: 8.50,
        maxAmount: "₹15Cr",
        tags: ["Govt. Bank", "Trusted"],
        processingFee: "Zero for women",
        prepaymentCharges: "Nil",
        features: [
            "Special rates for women",
            "Longest tenure up to 30 years",
            "Construction loan available",
            "Lower processing charges"
        ],
        category: "home"
    },
    {
        id: "home-3",
        bankName: "LIC Housing",
        bankLogo: "/bank/LICHFL.jpg",
        interestRate: 8.25,
        maxAmount: "₹5Cr",
        tags: ["Best Rate", "Insurance Backed"],
        processingFee: "0.25% of loan",
        prepaymentCharges: "Zero",
        features: [
            "Attractive interest rates",
            "Free insurance cover",
            "Quick approval process",
            "Renovation loans available"
        ],
        category: "home"
    },
    {
        id: "home-4",
        bankName: "ICICI Home Loans",
        bankLogo: "/bank/ICICIBank.jpg",
        interestRate: 8.75,
        maxAmount: "₹8Cr",
        tags: ["Digital", "Fast Processing"],
        processingFee: "0.5%",
        prepaymentCharges: "2% for fixed rate",
        features: [
            "Instant approval online",
            "Flexible repayment options",
            "Top-up loan facility",
            "Overdraft facility available"
        ],
        category: "home"
    },

    // Personal Loans
    {
        id: "personal-1",
        bankName: "Bajaj Finserv",
        bankLogo: "/bank/BAJAJFINSERV.jpg",
        interestRate: 11.00,
        maxAmount: "₹40L",
        tags: ["Instant Approval", "No Collateral"],
        processingFee: "Up to 3.93%",
        prepaymentCharges: "4% + GST",
        features: [
            "Instant disbursal in minutes",
            "Minimal documentation",
            "Flexi loan option",
            "No end-use restriction"
        ],
        category: "personal"
    },
    {
        id: "personal-2",
        bankName: "HDFC Bank",
        bankLogo: "/bank/HDFCBank.jpg",
        interestRate: 10.50,
        maxAmount: "₹40L",
        tags: ["Pre-approved", "Quick"],
        processingFee: "Up to 2.5%",
        prepaymentCharges: "2-4%",
        features: [
            "Pre-approved for existing customers",
            "Same day approval",
            "Competitive rates",
            "Minimal paperwork"
        ],
        category: "personal"
    },
    {
        id: "personal-3",
        bankName: "Axis Bank",
        bankLogo: "🏛️",
        interestRate: 10.99,
        maxAmount: "₹50L",
        tags: ["High Amount", "Flexible"],
        processingFee: "2% onwards",
        prepaymentCharges: "3-5%",
        features: [
            "Tenure up to 7 years",
            "Part-payment allowed",
            "Simple online process",
            "Attractive rates for salaried"
        ],
        category: "personal"
    },
    {
        id: "personal-4",
        bankName: "ICICI Bank",
        bankLogo: "/bank/ICICIBank.jpg",
        interestRate: 10.75,
        maxAmount: "₹50L",
        tags: ["Pre-approved", "Digital"],
        processingFee: "2.5%",
        prepaymentCharges: "3%",
        features: [
            "Instant money in account",
            "100% digital journey",
            "Flexible EMI options",
            "Top-up facility available"
        ],
        category: "personal"
    },

    // Business Loans
    {
        id: "business-1",
        bankName: "HDFC Bank",
        bankLogo: "/bank/HDFCBank.jpg",
        interestRate: 12.50,
        maxAmount: "₹75L",
        tags: ["MSME Friendly", "Quick"],
        processingFee: "2% of loan",
        prepaymentCharges: "2-3%",
        features: [
            "Collateral-free options",
            "Working capital support",
            "Overdraft facility",
            "Growth-focused lending"
        ],
        category: "business"
    },
    {
        id: "business-2",
        bankName: "SBI",
        bankLogo: "/bank/sbi.webp",
        interestRate: 11.75,
        maxAmount: "₹200Cr",
        tags: ["Govt. Bank", "MSME"],
        processingFee: "1% of loan",
        prepaymentCharges: "Nil",
        features: [
            "Government-backed schemes",
            "Lower interest rates",
            "Long tenure options",
            "Priority sector lending"
        ],
        category: "business"
    },
    {
        id: "business-3",
        bankName: "Bajaj Finserv",
        bankLogo: "/bank/BAJAJFINSERV.jpg",
        interestRate: 14.00,
        maxAmount: "₹80L",
        tags: ["No Collateral", "Fast"],
        processingFee: "3% onwards",
        prepaymentCharges: "4-5%",
        features: [
            "Quick approval in 48 hours",
            "Minimal documentation",
            "Flexi loan facility",
            "Digital application"
        ],
        category: "business"
    },
    {
        id: "business-4",
        bankName: "ICICI Bank",
        bankLogo: "/bank/ICICIBank.jpg",
        interestRate: 13.25,
        maxAmount: "₹1Cr",
        tags: ["Working Capital", "Overdraft"],
        processingFee: "2.5%",
        prepaymentCharges: "3%",
        features: [
            "Overdraft facility up to 1Cr",
            "Interest on utilized amount",
            "Instant online approval",
            "Dedicated relationship manager"
        ],
        category: "business"
    }
];

export const categories = [
    { id: "education", title: "Top Education Loans for Study Abroad" },
    { id: "home", title: "Best Home Loans - Low Interest Rates 2025" },
    { id: "personal", title: "Instant Personal Loans - Quick Approval" },
    { id: "business", title: "Business & MSME Loans - Grow Your Venture" }
];
