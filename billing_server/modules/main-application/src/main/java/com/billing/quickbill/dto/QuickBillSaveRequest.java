package com.billing.quickbill.dto;

import lombok.Data;

@Data
public class QuickBillSaveRequest {
    private Double amount;
    private String payMode;
    private Double tipsAmount;
    private String tipsPayMode;
    private String notes;
}
