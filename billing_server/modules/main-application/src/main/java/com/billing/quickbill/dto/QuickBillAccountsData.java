package com.billing.quickbill.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class QuickBillAccountsData {
    private List<QuickBillAccountRow> rows = new ArrayList<>();
    private String shopId;
    private String shopName;
    private Double cashTotal = 0.0;
    private Double bankTotal = 0.0;
    private Double grandTotal = 0.0;
    private Double tipsTotal = 0.0;
    private Double incentiveTotal = 0.0;
    private Double expenseTotal = 0.0;
    private Double finalCashTotal = 0.0;
    private Double finalBankTotal = 0.0;
    private Integer count = 0;
}
