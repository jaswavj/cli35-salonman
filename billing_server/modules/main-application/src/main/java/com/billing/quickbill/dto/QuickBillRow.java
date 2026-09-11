package com.billing.quickbill.dto;

import lombok.Data;

@Data
public class QuickBillRow {
    private Long id;
    private Double amount;
    private String payMode;
    private Double tipsAmount;
    private String tipsPayMode;
    private String notes;
    private String shopId;
    private String shopName;
    private Long userId;
    private String userName;
    private String billDate;
    private String billTime;
    private Integer isCancelled;
}
