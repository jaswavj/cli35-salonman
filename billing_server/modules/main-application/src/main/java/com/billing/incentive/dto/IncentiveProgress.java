package com.billing.incentive.dto;

import lombok.Data;

@Data
public class IncentiveProgress {
    private Long userId;
    private String userName;
    private String shopId;
    private String shopName;
    private Double collection = 0.0;
    private Double target;
    private Double incentiveEarn = 0.0;
    private Double nextTarget;
    private Double toNext = 0.0;
}
