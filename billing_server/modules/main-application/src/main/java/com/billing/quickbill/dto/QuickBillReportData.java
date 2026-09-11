package com.billing.quickbill.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class QuickBillReportData {
    private List<QuickBillRow> rows = new ArrayList<>();
    private Double cashTotal = 0.0;
    private Double gpayTotal = 0.0;
    private Double grandTotal = 0.0;
    private Integer count = 0;
}
