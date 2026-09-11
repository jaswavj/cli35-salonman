package com.billing.quickbill.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class QuickBillTrendData {
    private List<QuickBillDayRow> days = new ArrayList<>();
    private Double cashTotal = 0.0;
    private Double gpayTotal = 0.0;
    private Double grandTotal = 0.0;
    private Integer count = 0;
}
