"""
Unit tests for credit scoring engine.
Run with: pytest tests/test_scoring.py -v
"""

import pytest
import sys
sys.path.insert(0, '..')

from app.main import LoanSession, calculate_score_and_decision, get_missing_fields


class TestCreditScoring:
    """Test the credit scoring calculation engine"""
    
    def test_baseline_score_is_300(self):
        """Score should start at 300 (lowest possible)"""
        session = LoanSession(
            session_id="test-1",
            payment_history_rating=0,
            credit_utilization=1.0,  # 100% utilization
            credit_history_years=0,
            open_credit_lines=0,
            recent_inquiries=10,
            bankruptcy_history=1,
            defaults_history=1,
            annual_income=100000,
            monthly_debt=50000,
            loan_amount=500000
        )
        result = calculate_score_and_decision(session)
        assert result["score"] == 300, "Worst case should be 300"
    
    def test_excellent_profile_high_score(self):
        """Excellent profile should score above 800"""
        session = LoanSession(
            session_id="test-2",
            payment_history_rating=60,  # Perfect
            credit_utilization=0.1,     # 10% - excellent
            credit_history_years=15,    # Long history
            open_credit_lines=5,        # Good mix
            recent_inquiries=0,         # No inquiries
            bankruptcy_history=0,       # No bankruptcy
            defaults_history=0,         # No defaults
            annual_income=1200000,      # 10L/year
            monthly_debt=20000,         # Low debt
            loan_amount=500000
        )
        result = calculate_score_and_decision(session)
        assert result["score"] >= 800, f"Excellent profile should be 800+, got {result['score']}"
        assert result["decision"] == "APPROVED"
    
    def test_bankruptcy_penalty(self):
        """Bankruptcy should reduce score by 150 points"""
        base_session = LoanSession(
            session_id="test-3",
            payment_history_rating=50,
            credit_utilization=0.3,
            credit_history_years=5,
            open_credit_lines=3,
            recent_inquiries=1,
            bankruptcy_history=0,
            defaults_history=0,
            annual_income=600000,
            monthly_debt=15000,
            loan_amount=300000
        )
        
        bankruptcy_session = LoanSession(
            **{**base_session.model_dump(), "bankruptcy_history": 1, "session_id": "test-4"}
        )
        
        base_result = calculate_score_and_decision(base_session)
        bankruptcy_result = calculate_score_and_decision(bankruptcy_session)
        
        assert base_result["score"] - bankruptcy_result["score"] == 150
        assert "Bankruptcy" in str(bankruptcy_result["red_flags"])
    
    def test_defaults_penalty(self):
        """Defaults should reduce score by 100 points"""
        base_session = LoanSession(
            session_id="test-5",
            payment_history_rating=50,
            credit_utilization=0.3,
            credit_history_years=5,
            open_credit_lines=3,
            recent_inquiries=1,
            bankruptcy_history=0,
            defaults_history=0,
            annual_income=600000,
            monthly_debt=15000,
            loan_amount=300000
        )
        
        defaults_session = LoanSession(
            **{**base_session.model_dump(), "defaults_history": 1, "session_id": "test-6"}
        )
        
        base_result = calculate_score_and_decision(base_session)
        defaults_result = calculate_score_and_decision(defaults_session)
        
        assert base_result["score"] - defaults_result["score"] == 100
    
    def test_high_dti_rejection(self):
        """DTI over 50% should result in rejection"""
        session = LoanSession(
            session_id="test-7",
            payment_history_rating=55,
            credit_utilization=0.2,
            credit_history_years=7,
            open_credit_lines=4,
            recent_inquiries=1,
            bankruptcy_history=0,
            defaults_history=0,
            annual_income=600000,     # 50K/month
            monthly_debt=30000,        # 60% DTI
            loan_amount=300000
        )
        result = calculate_score_and_decision(session)
        assert result["decision"] == "REJECTED"
        assert "DTI" in result["reason"]
    
    def test_low_score_rejection(self):
        """Score below 650 should result in rejection"""
        session = LoanSession(
            session_id="test-8",
            payment_history_rating=20,  # Poor
            credit_utilization=0.8,     # High
            credit_history_years=1,     # Short
            open_credit_lines=1,        # Few
            recent_inquiries=5,         # Many
            bankruptcy_history=0,
            defaults_history=0,
            annual_income=300000,
            monthly_debt=5000,
            loan_amount=200000
        )
        result = calculate_score_and_decision(session)
        assert result["score"] < 650
        assert result["decision"] == "REJECTED"
    
    def test_score_capped_at_900(self):
        """Score should never exceed 900"""
        session = LoanSession(
            session_id="test-9",
            payment_history_rating=60,
            credit_utilization=0.0,
            credit_history_years=20,
            open_credit_lines=10,
            recent_inquiries=0,
            bankruptcy_history=0,
            defaults_history=0,
            annual_income=5000000,
            monthly_debt=0,
            loan_amount=100000
        )
        result = calculate_score_and_decision(session)
        assert result["score"] <= 900
    
    def test_radar_data_structure(self):
        """Radar data should have correct structure"""
        session = LoanSession(
            session_id="test-10",
            payment_history_rating=40,
            credit_utilization=0.5,
            credit_history_years=3,
            open_credit_lines=2,
            recent_inquiries=2,
            bankruptcy_history=0,
            defaults_history=0,
            annual_income=600000,
            monthly_debt=15000,
            loan_amount=300000
        )
        result = calculate_score_and_decision(session)
        
        assert len(result["radar_data"]) == 6
        for item in result["radar_data"]:
            assert "letter" in item
            assert "frequency" in item
            assert 0 <= item["frequency"] <= 100
    
    def test_health_score_percentage(self):
        """Health score should be 0-100 percentage"""
        session = LoanSession(
            session_id="test-11",
            payment_history_rating=45,
            credit_utilization=0.35,
            credit_history_years=5,
            open_credit_lines=3,
            recent_inquiries=1,
            bankruptcy_history=0,
            defaults_history=0,
            annual_income=600000,
            monthly_debt=15000,
            loan_amount=300000
        )
        result = calculate_score_and_decision(session)
        assert 0 <= result["health_score"] <= 100


class TestMissingFields:
    """Test the missing fields detector"""
    
    def test_all_fields_missing(self):
        """New session should have all fields missing"""
        session = LoanSession(session_id="test-missing-1")
        missing = get_missing_fields(session)
        assert len(missing) == 10
    
    def test_partial_fields(self):
        """Partial data should show remaining missing"""
        session = LoanSession(
            session_id="test-missing-2",
            annual_income=500000,
            monthly_debt=10000,
            loan_amount=300000
        )
        missing = get_missing_fields(session)
        assert len(missing) == 7
        assert "Annual Income" not in missing
        assert "Monthly Debt Payments" not in missing
    
    def test_complete_session(self):
        """Complete session should have no missing fields"""
        session = LoanSession(
            session_id="test-complete",
            payment_history_rating=50,
            credit_utilization=0.3,
            credit_history_years=5,
            open_credit_lines=3,
            recent_inquiries=1,
            bankruptcy_history=0,
            defaults_history=0,
            annual_income=600000,
            monthly_debt=15000,
            loan_amount=300000
        )
        missing = get_missing_fields(session)
        assert len(missing) == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
