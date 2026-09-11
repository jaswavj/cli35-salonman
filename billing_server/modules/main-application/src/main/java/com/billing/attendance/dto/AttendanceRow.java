package com.billing.attendance.dto;

import lombok.Data;

@Data
public class AttendanceRow {
    private Long id;
    private String punchType;
    private String notes;
    private String shopId;
    private String shopName;
    private Long userId;
    private String userName;
    private String punchDate;
    private String punchTime;
    private String punchDateIso;
    private String punchTimeIso;
}
