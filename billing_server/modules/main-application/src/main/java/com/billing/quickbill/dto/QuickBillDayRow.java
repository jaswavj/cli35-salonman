package com.billing.quickbill.dto;

import lombok.Data;

@Data
public class QuickBillDayRow {
    private String date;
    private String label;
    private String weekday;
    private Boolean today = false;
    private Double cash = 0.0;
    private Double gpay = 0.0;
    private Double total = 0.0;
    private Integer count = 0;
}
