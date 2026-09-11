package com.billing.quickbill.dto;

import lombok.Data;

@Data
public class QuickBillAccountRow {
    private Long userId;
    private String userName;
    private String shopId;
    private String shopName;
    private Double cashTotal = 0.0;
    private Double bankTotal = 0.0;
    private Double total = 0.0;
    private Double tipsTotal = 0.0;
    private Double tipsCash = 0.0;
    private Double tipsBank = 0.0;
    private Double incentiveEarn = 0.0;
    private Double expenseTotal = 0.0;
    private Double finalCash = 0.0;
    private Double finalBank = 0.0;
}
