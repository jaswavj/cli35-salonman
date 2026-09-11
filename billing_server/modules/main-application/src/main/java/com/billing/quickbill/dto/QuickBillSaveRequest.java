package com.billing.quickbill.dto;

import lombok.Data;

@Data
public class QuickBillSaveRequest {
    private Double amount;
    private String payMode;
    private String notes;
}
