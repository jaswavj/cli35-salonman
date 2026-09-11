package com.billing.incentive.dto;

import lombok.Data;

@Data
public class IncentiveRow {
    private Long id;
    private String shopId;
    private String shopName;
    private Long userId;
    private String userName;
    private Double targetAmount;
    private String compareType;
    private String incentiveMode;
    private Double incentiveValue;
}
