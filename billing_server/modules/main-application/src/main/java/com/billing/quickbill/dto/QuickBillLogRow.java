package com.billing.quickbill.dto;

import lombok.Data;

@Data
public class QuickBillLogRow {
    private Long id;
    private Long billId;
    private String action;
    private Double oldAmount;
    private Double newAmount;
    private String oldPayMode;
    private String newPayMode;
    private String oldNotes;
    private String newNotes;
    private String reason;
    private String userName;
    private String shopName;
    private String logDate;
    private String logTime;
}
